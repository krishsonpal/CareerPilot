"""
CareerPilot — Job Search and Fetch Routes (Public/Student)
Recruiter job management is in recruiter_routes.py.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import jobs
from utils.auth import get_current_user, require_student
from services.job_matching import search_jobs_by_query, find_matching_jobs

router = APIRouter()


@router.get("/", response_model=List[schemas.JobResponse])
async def list_jobs(
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List active jobs with optional filtering."""
    return await jobs.get_jobs(
        db=db,
        status="active",
        job_type=job_type,
        location=location,
        experience_level=experience_level,
        limit=limit,
        offset=offset
    )


@router.get("/search", response_model=List[schemas.JobResponse])
async def search_jobs(
    q: str = Query(..., min_length=3, description="Semantic search query"),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    Search jobs using natural language and semantic vector search.
    Example: 'Remote Python backend roles'
    """
    try:
        results = await search_jobs_by_query(db=db, query=q, limit=limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/recommended", response_model=List[schemas.JobResponse])
async def get_recommended_jobs(
    limit: int = Query(5, le=20),
    user_id: str = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Get recommended jobs based on the student's resume embedding."""
    try:
        results = await find_matching_jobs(db=db, user_id=user_id, limit=limit)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get details of a specific job."""
    job = await jobs.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job
