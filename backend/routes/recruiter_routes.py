"""
CareerPilot — Recruiter Routes
Handles job creation, editing, and applicant management for companies.

Job embedding flow (async via BullMQ):
  POST /api/recruiter/jobs
    → saves job to DB immediately (embedding = null)
    → enqueues 'job-embed' job to BullMQ worker
    → returns 201 Created instantly (< 100ms)

The worker generates the 768-dim Gemini vector and updates jobs.embedding.
Until the worker completes, the job will appear in listings but not in
vector search results (this window is typically < 5 seconds).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db import schemas
from db.crud import jobs, applications
from utils.auth import require_recruiter
from utils.queue import enqueue_job_embed

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Job Management
# ---------------------------------------------------------------------------
@router.post("/jobs", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
async def create_new_job(
    job_data: schemas.JobCreate,
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """
    Post a new job listing.

    Returns 201 Created immediately.
    The Gemini vector embedding is generated asynchronously by the BullMQ worker.
    The job will become semantically searchable once the worker finishes (typically < 5s).
    """
    # Save job immediately — no embedding yet (worker handles it)
    job = await jobs.create_job(
        db=db,
        company_id=company_id,
        title=job_data.title,
        description=job_data.description,
        skills_required=job_data.skills_required,
        job_type=job_data.job_type,
        location=job_data.location,
        is_remote=job_data.is_remote,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        duration=job_data.duration,
        experience_level=job_data.experience_level,
        openings=job_data.openings,
        deadline=job_data.deadline,
        embedding=None  # Will be populated asynchronously by the BullMQ worker
    )

    # Enqueue embedding generation to BullMQ worker (non-blocking)
    combined_text = (
        f"{job_data.title}\n"
        f"{job_data.description}\n"
        f"Skills: {', '.join(job_data.skills_required)}"
    )
    try:
        await enqueue_job_embed(job_id=str(job.id), combined_text=combined_text)
        logger.info("Enqueued job-embed for job_id=%s", job.id)
    except RuntimeError as exc:
        # Non-fatal: job is saved and active, just not semantically searchable yet
        logger.warning(
            "Could not enqueue job-embed (worker unavailable): %s. "
            "Job %s saved without embedding — run worker to fix.",
            exc, job.id
        )

    return job


@router.get("/jobs", response_model=List[schemas.JobResponse])
async def my_jobs(
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """List all jobs posted by the current recruiter."""
    # We can reuse get_jobs but filter by company_id
    # We'll fetch all statuses (active, closed, etc) for the recruiter
    return await jobs.get_jobs(
        db=db,
        company_id=company_id,
        status="active", # we could modify crud to allow no status filter
        limit=100
    )


@router.put("/jobs/{job_id}", response_model=schemas.JobResponse)
async def update_job_details(
    job_id: str,
    update_data: schemas.JobUpdate,
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """Update a job posting. Re-queues embedding generation if content changed."""
    updated = await jobs.update_job(
        db=db,
        job_id=job_id,
        company_id=company_id,
        **update_data.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    # Re-queue embedding if content-bearing fields changed
    update_fields = update_data.model_dump(exclude_unset=True)
    content_fields = {"title", "description", "skills_required"}
    if content_fields & set(update_fields.keys()):
        combined_text = (
            f"{updated.title}\n"
            f"{updated.description}\n"
            f"Skills: {', '.join(updated.skills_required or [])}"
        )
        try:
            await enqueue_job_embed(job_id=job_id, combined_text=combined_text)
            logger.info("Re-queued job-embed for updated job_id=%s", job_id)
        except RuntimeError as exc:
            logger.warning("Could not re-enqueue job-embed for job=%s: %s", job_id, exc)

    return updated


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_posting(
    job_id: str,
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """Delete a job posting."""
    success = await jobs.delete_job(db, job_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")
    return None


# ---------------------------------------------------------------------------
# Applicant Tracking
# ---------------------------------------------------------------------------
@router.get("/jobs/{job_id}/applications", response_model=List[schemas.ApplicationResponse])
async def list_job_applications(
    job_id: str,
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """Get all applications for a specific job, ranked by match score."""
    # First verify the recruiter owns this job
    job = await jobs.get_job_by_id(db, job_id)
    if not job or str(job.company_id) != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view applications for this job.")
    
    return await applications.get_applications_by_job(db, job_id)


@router.patch("/applications/{application_id}/status", response_model=schemas.ApplicationResponse)
async def update_applicant_status(
    application_id: str,
    status_update: schemas.ApplicationStatusUpdate,
    company_id: str = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db)
):
    """Update the status of an application (e.g. applied -> shortlisted)."""
    try:
        updated = await applications.update_application_status(
            db=db,
            application_id=application_id,
            new_status=status_update.status,
            recruiter_company_id=company_id
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Application not found or unauthorized.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
