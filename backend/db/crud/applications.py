"""
CareerPilot — Applications CRUD
Async database operations for the applications table.
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Application, Job, User

logger = logging.getLogger(__name__)

# Valid status transitions
VALID_STATUSES = {"applied", "shortlisted", "interviewing", "rejected", "selected"}


async def create_application(
    db: AsyncSession,
    user_id: str,
    job_id: str,
    cover_letter: Optional[str] = None,
    match_score: Optional[float] = None,
    matched_skills: Optional[List[str]] = None,
    missing_skills: Optional[List[str]] = None,
) -> Application:
    """
    Create a new job application.

    The match_score, matched_skills, and missing_skills should be computed
    by the AI matching service before calling this function.

    Args:
        db:             Async DB session.
        user_id:        UUID of the applying student.
        job_id:         UUID of the target job.
        cover_letter:   Optional cover letter text.
        match_score:    AI-computed match percentage (0–100).
        matched_skills: Skills user has that match the job.
        missing_skills: Skills gap — required but user doesn't have.

    Returns:
        Newly created Application ORM instance.

    Raises:
        sqlalchemy.exc.IntegrityError: If user has already applied to this job.
    """
    application = Application(
        user_id=user_id,
        job_id=job_id,
        status="applied",
        cover_letter=cover_letter,
        match_score=match_score,
        matched_skills=matched_skills or [],
        missing_skills=missing_skills or [],
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)
    logger.info(
        "create_application: user=%s applied to job=%s score=%.1f",
        user_id, job_id, match_score or 0,
    )
    return application


async def get_application_by_id(
    db: AsyncSession, application_id: str
) -> Optional[Application]:
    """Fetch a single application by its UUID."""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    return result.scalar_one_or_none()


async def get_applications_by_user(
    db: AsyncSession, user_id: str, limit: int = 50, offset: int = 0
) -> List[Application]:
    """
    Fetch all applications submitted by a student.
    Ordered by most recent first.
    """
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_applications_by_job(
    db: AsyncSession, job_id: str, limit: int = 100, offset: int = 0
) -> List[Application]:
    """
    Fetch all applications for a specific job.
    Ordered by match_score descending (best matches first).
    Used by recruiters to rank candidates.
    """
    result = await db.execute(
        select(Application)
        .where(Application.job_id == job_id)
        .order_by(Application.match_score.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_existing_application(
    db: AsyncSession, user_id: str, job_id: str
) -> Optional[Application]:
    """Check if a user has already applied to a specific job."""
    result = await db.execute(
        select(Application).where(
            Application.user_id == user_id,
            Application.job_id == job_id,
        )
    )
    return result.scalar_one_or_none()


async def update_application_status(
    db: AsyncSession,
    application_id: str,
    new_status: str,
    recruiter_company_id: str,
) -> Optional[Application]:
    """
    Update application status. Only the job's owning company can update.

    Args:
        application_id:      UUID of the application.
        new_status:          One of: applied|shortlisted|interviewing|rejected|selected
        recruiter_company_id: UUID of the company — must own the job.

    Returns:
        Updated Application, or None if not found / not authorized.
    """
    if new_status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {VALID_STATUSES}")

    # Verify the recruiter owns the job this application is for
    result = await db.execute(
        select(Application)
        .join(Job, Application.job_id == Job.id)
        .where(
            Application.id == application_id,
            Job.company_id == recruiter_company_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        return None

    application.status = new_status
    await db.flush()
    await db.refresh(application)
    return application


async def delete_application(
    db: AsyncSession, application_id: str, user_id: str
) -> bool:
    """
    Withdraw an application. Only the applicant can withdraw.

    Returns:
        True if deleted, False if not found / not owner.
    """
    result = await db.execute(
        delete(Application).where(
            Application.id == application_id,
            Application.user_id == user_id,
        )
    )
    return result.rowcount > 0


async def count_applications_by_job(db: AsyncSession, job_id: str) -> int:
    """Return total number of applications for a job posting."""
    result = await db.execute(
        select(func.count()).where(Application.job_id == job_id)
    )
    return result.scalar_one() or 0
