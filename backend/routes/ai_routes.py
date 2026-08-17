"""
CareerPilot — AI Routes (Student)
Handles resume upload (async via BullMQ) and AI chat.

Resume upload flow (async):
  POST /api/ai/resume/upload
    → saves file to disk immediately
    → enqueues 'resume-parse' job to BullMQ worker
    → returns 202 Accepted with task_id

  GET /api/ai/resume/status/{task_id}
    → polls BullMQ worker service for job state

This design keeps API response times < 300ms regardless of
Gemini processing time (typically 5-15s for large resumes).
"""

import os
import logging
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import resume
from utils.auth import require_student
from utils.config import settings
from utils.queue import enqueue_resume_parse, get_task_status

logger = logging.getLogger(__name__)

# Keep the recommendation import for the HTTP chat fallback
from services.recommendation import process_user_message, get_chat_history

router = APIRouter()


# ---------------------------------------------------------------------------
# Resume Upload — Async (returns 202, processing happens in BullMQ worker)
# ---------------------------------------------------------------------------
@router.post("/resume/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a resume (PDF/TXT) and enqueue async processing via BullMQ.

    Returns 202 Accepted immediately with a task_id.
    Poll GET /api/ai/resume/status/{task_id} to check progress.
    Once complete, GET /api/ai/resume returns the parsed profile.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pdf", ".txt"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported",
        )

    # ── Save file to disk (fast, < 50ms) ──────────────────────────────────
    static_dir = os.path.join(os.getcwd(), "static", "resumes")
    os.makedirs(static_dir, exist_ok=True)

    safe_filename = file.filename.replace(" ", "_")
    file_path = os.path.join(static_dir, f"{user_id}_{safe_filename}")
    resume_url = f"/static/resumes/{user_id}_{safe_filename}"

    try:
        content = await file.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large (max {settings.max_upload_size_mb}MB)",
            )
        with open(file_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Resume file save failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    # ── Mark resume as processing in DB (pre-create row if not exists) ─────
    # This ensures GET /api/ai/resume/status can always find a row to check
    try:
        existing = await resume.get_resume_profile(db, user_id)
        if existing:
            # Update status to processing
            await db.execute(
                "UPDATE resume_profiles SET processing_status = 'processing', "
                "resume_url = :url WHERE user_id = :uid",
                {"url": resume_url, "uid": user_id},
            )
        else:
            # Insert a skeleton row so the worker can do an upsert
            await resume.create_processing_placeholder(
                db=db, user_id=user_id, resume_url=resume_url
            )
        await db.commit()
    except Exception as exc:
        logger.warning("Could not pre-create resume placeholder: %s", exc)
        # Non-fatal — worker will handle the upsert regardless

    # ── Enqueue to BullMQ worker ───────────────────────────────────────────
    try:
        task = await enqueue_resume_parse(
            user_id=user_id,
            file_path=file_path,
            resume_url=resume_url,
        )
    except RuntimeError as exc:
        logger.error("Failed to enqueue resume parse: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "Worker service is unavailable. "
                "Ensure the BullMQ worker is running on "
                f"{settings.worker_service_url}. Error: {exc}"
            ),
        )

    return {
        "task_id": task.get("task_id"),
        "status": "queued",
        "message": (
            "Resume uploaded successfully. Processing started in the background. "
            "Poll /api/ai/resume/status/{task_id} to track progress."
        ),
        "resume_url": resume_url,
    }


# ---------------------------------------------------------------------------
# Resume Processing Status — Poll BullMQ worker for task state
# ---------------------------------------------------------------------------
@router.get("/resume/status/{task_id}")
async def get_resume_status(
    task_id: str,
    user_id: str = Depends(require_student),
):
    """
    Poll the BullMQ worker for the status of a resume parse job.

    Returns:
        state:    waiting | active | completed | failed
        progress: 0-100 integer
        result:   populated when state == 'completed'
    """
    try:
        status_data = await get_task_status("resume-parse", task_id)
        return status_data
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# ---------------------------------------------------------------------------
# Get Resume Profile — Retrieve parsed result after processing completes
# ---------------------------------------------------------------------------
@router.get("/resume", response_model=schemas.ResumeProfileResponse)
async def get_my_resume(
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Get the currently logged in student's parsed resume profile."""
    profile = await resume.get_resume_profile(db, user_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No resume profile found. Upload a resume via POST /api/ai/resume/upload first.",
        )
    return profile


# ---------------------------------------------------------------------------
# AI Chat — Uses existing synchronous handler (will be migrated to Socket.IO in Phase 3)
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_assistant(
    request: schemas.ChatRequest,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with the AI Career Assistant.
    NOTE: This HTTP endpoint will be superseded by Socket.IO streaming in Phase 3.
    """
    try:
        result = await process_user_message(db, user_id, request.message)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/chat/history", response_model=List[schemas.ChatMessage])
async def get_chat(
    limit: int = 20,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Get previous chat messages."""
    return await get_chat_history(db, user_id, limit=limit)
