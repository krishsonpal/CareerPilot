"""
CareerPilot — AI Routes (Student)
Handles the AI Assistant Chat and Resume Parsing.
"""

import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import resume
from utils.auth import require_student
from utils.config import settings
from services.resume_parser import process_resume_file
from services.recommendation import process_user_message, get_chat_history

router = APIRouter()


@router.post("/resume/upload", response_model=schemas.ResumeProfileResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and parse a resume (PDF/TXT).
    Uses Gemini to extract structured data and generate embeddings.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save file temporarily
    os.makedirs(settings.upload_dir, exist_ok=True)
    temp_path = os.path.join(settings.upload_dir, f"{user_id}_{file.filename}")
    
    try:
        content = await file.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
             raise HTTPException(status_code=400, detail="File too large")
             
        with open(temp_path, "wb") as f:
            f.write(content)

        # Process with AI
        profile_data = process_resume_file(temp_path)

        # Save to DB
        profile = await resume.save_resume_profile(
            db=db,
            user_id=user_id,
            summary=profile_data["summary"],
            skills=profile_data["skills"],
            embedding=profile_data["embedding"],
            raw_text=profile_data["raw_text"],
            education=profile_data["education"],
            experience=profile_data["experience"],
            projects=profile_data["projects"],
        )
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/resume", response_model=schemas.ResumeProfileResponse)
async def get_my_resume(
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Get the currently logged in student's parsed resume profile."""
    profile = await resume.get_resume_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="No resume profile found.")
    return profile


@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_assistant(
    request: schemas.ChatRequest,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Chat with the AI Career Assistant."""
    try:
        result = await process_user_message(db, user_id, request.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history", response_model=List[schemas.ChatMessage])
async def get_chat(
    limit: int = 20,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Get previous chat messages."""
    return await get_chat_history(db, user_id, limit=limit)
