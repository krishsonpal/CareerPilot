"""
CareerPilot — Application Routes (Student)
Allows students to apply for jobs and track applications.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import applications, jobs
from utils.auth import require_student
from services.job_matching import calculate_match_score

router = APIRouter()


@router.post("/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    app_data: schemas.ApplicationApply,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Apply for a job.
    Automatically calculates AI match score.
    """
    # 1. Check if job exists
    job = await jobs.get_job_by_id(db, str(app_data.job_id))
    if not job or job.status != "active":
        raise HTTPException(status_code=400, detail="Job is not active or does not exist.")

    # 2. Check if already applied
    existing = await applications.get_existing_application(db, user_id, str(app_data.job_id))
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    # 3. Calculate AI Match Score
    try:
        match_data = await calculate_match_score(db, user_id, str(app_data.job_id))
    except ValueError as e:
        # e.g., missing resume
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Fallback if Gemini fails
        match_data = {"score": 0.0, "matched_skills": [], "missing_skills": []}

    # 4. Create application
    application = await applications.create_application(
        db=db,
        user_id=user_id,
        job_id=str(app_data.job_id),
        cover_letter=app_data.cover_letter,
        match_score=match_data["score"],
        matched_skills=match_data["matched_skills"],
        missing_skills=match_data["missing_skills"],
    )
    return application


@router.get("/me", response_model=List[schemas.ApplicationResponse])
async def my_applications(
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Get all applications submitted by the current student."""
    return await applications.get_applications_by_user(db, user_id)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: str,
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Withdraw an application."""
    success = await applications.delete_application(db, application_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized.")
    return None
