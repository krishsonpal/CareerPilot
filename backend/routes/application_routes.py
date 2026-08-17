"""
CareerPilot — Application Routes (Student)
Allows students to apply for jobs and track applications.

Match score computation flow (async via BullMQ):
  POST /api/applications/
    → validates job + no duplicate application
    → creates application row immediately with status='applied', match_score=null
    → enqueues 'match-score' job to BullMQ worker
    → returns 202 Accepted with application + task_id

The worker asynchronously computes the AI score and updates the row.
The frontend can poll GET /api/applications/me and check for non-null match_score.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import applications, jobs
from utils.auth import require_student
from utils.queue import enqueue_match_score, get_task_status

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Apply for Job — Async match score computation via BullMQ
# ---------------------------------------------------------------------------
@router.post(
    "/",
    status_code=status.HTTP_202_ACCEPTED,
)
async def apply_for_job(
    app_data: schemas.ApplicationApply,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Apply for a job posting.

    Returns 202 Accepted immediately.
    The AI match score is computed asynchronously by the BullMQ worker.
    Poll GET /api/applications/me and check for a non-null match_score field.
    """
    # 1. Validate job exists and is active
    job = await jobs.get_job_by_id(db, str(app_data.job_id))
    if not job or job.status != "active":
        raise HTTPException(
            status_code=400, detail="Job is not active or does not exist."
        )

    # 2. Prevent duplicate application
    existing = await applications.get_existing_application(
        db, user_id, str(app_data.job_id)
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="You have already applied to this job."
        )

    # 3. Create application immediately with null match_score
    #    The BullMQ worker will fill in score, matched_skills, missing_skills
    application = await applications.create_application(
        db=db,
        user_id=user_id,
        job_id=str(app_data.job_id),
        cover_letter=app_data.cover_letter,
        match_score=None,           # Will be set asynchronously by worker
        matched_skills=[],
        missing_skills=[],
    )

    # 4. Enqueue match score computation to BullMQ worker
    task_id = None
    try:
        task = await enqueue_match_score(
            user_id=user_id,
            job_id=str(app_data.job_id),
            application_id=str(application.id),
        )
        task_id = task.get("task_id")
        logger.info(
            "Enqueued match-score task_id=%s for application=%s",
            task_id,
            application.id,
        )
    except RuntimeError as exc:
        # Non-fatal: application is already created, score will just stay null
        logger.warning(
            "Could not enqueue match-score job (worker unavailable): %s. "
            "Application %s created without score.",
            exc,
            application.id,
        )

    return {
        "application_id": str(application.id),
        "job_id": str(application.job_id),
        "status": application.status,
        "match_score": None,
        "task_id": task_id,
        "message": (
            "Application submitted. Your match score is being computed in the "
            "background and will appear in your applications list shortly."
        ),
    }


# ---------------------------------------------------------------------------
# My Applications
# ---------------------------------------------------------------------------
@router.get("/me", response_model=List[schemas.ApplicationResponse])
async def my_applications(
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications submitted by the current student."""
    return await applications.get_applications_by_user(db, user_id)


# ---------------------------------------------------------------------------
# Withdraw Application
# ---------------------------------------------------------------------------
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: str,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw an application."""
    success = await applications.delete_application(db, application_id, user_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Application not found or unauthorized."
        )
    return None
