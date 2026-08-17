"""
CareerPilot — Jobs CRUD
Async database operations for the jobs table.
Includes pgvector-based semantic similarity search.
"""

import logging
from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy import select, update, delete, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Job

logger = logging.getLogger(__name__)


async def create_job(
    db: AsyncSession,
    company_id: str,
    title: str,
    description: str,
    skills_required: List[str],
    job_type: str = "internship",
    location: Optional[str] = None,
    is_remote: bool = False,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    duration: Optional[str] = None,
    experience_level: Optional[str] = None,
    openings: int = 1,
    deadline: Optional[date] = None,
    embedding: Optional[List[float]] = None,
) -> Job:
    """
    Create a new job posting.

    The caller is responsible for generating the embedding before calling this.
    Typically: embedding = gemini_service.embed_text(f"{title} {description}")

    Args:
        db:              Async DB session.
        company_id:      UUID of the posting company.
        embedding:       768-dim Gemini embedding of the job description.
                         Pass None if embedding generation failed (job still saved).

    Returns:
        Newly created Job ORM instance.
    """
    job = Job(
        company_id=company_id,
        title=title.strip(),
        description=description.strip(),
        skills_required=skills_required,
        job_type=job_type,
        location=location,
        is_remote=is_remote,
        salary_min=salary_min,
        salary_max=salary_max,
        duration=duration,
        experience_level=experience_level,
        openings=openings,
        deadline=deadline,
        status="active",
        embedding=embedding,
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    logger.info("create_job: created job id=%s title=%s", job.id, job.title)
    return job


async def get_job_by_id(db: AsyncSession, job_id: str) -> Optional[Job]:
    """Fetch a single job by its UUID."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def get_jobs(
    db: AsyncSession,
    status: str = "active",
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    company_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Job]:
    """
    Fetch jobs with optional filtering and pagination.

    Args:
        status:          Filter by job status ('active', 'closed', 'draft').
        job_type:        Filter by type ('internship', 'full_time', etc.).
        location:        Case-insensitive partial match on location.
        experience_level: Filter by experience level.
        company_id:      Filter to a specific company's postings.
        limit:           Max number of results (default 20).
        offset:          Pagination offset.

    Returns:
        List of Job ORM instances.
    """
    query = select(Job).where(Job.status == status)

    if job_type:
        query = query.where(Job.job_type == job_type)
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if experience_level:
        query = query.where(Job.experience_level == experience_level)
    if company_id:
        query = query.where(Job.company_id == company_id)

    query = query.order_by(Job.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())


async def vector_search_jobs(
    db: AsyncSession,
    query_embedding: List[float],
    limit: int = 10,
    status: str = "active",
) -> List[Dict[str, Any]]:
    """
    Perform pgvector cosine similarity search over job embeddings.

    Uses the <=> operator (cosine distance) — lower distance = more similar.
    1 - distance = similarity score.

    Args:
        db:              Async DB session.
        query_embedding: 768-dim float vector (from resume or query embedding).
        limit:           Number of top matching jobs to return.
        status:          Only search jobs with this status.

    Returns:
        List of dicts with job fields + 'similarity_score' (0.0–1.0).
    """
    # Build embedding literal for pgvector
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    sql = text("""
        SELECT
            j.id,
            j.company_id,
            j.title,
            j.description,
            j.skills_required,
            j.job_type,
            j.location,
            j.is_remote,
            j.salary_min,
            j.salary_max,
            j.duration,
            j.experience_level,
            j.openings,
            j.deadline,
            j.status,
            j.created_at,
            1 - (j.embedding <=> CAST(:embedding AS vector)) AS similarity_score
        FROM jobs j
        WHERE j.status = :status
          AND j.embedding IS NOT NULL
        ORDER BY j.embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
    """)

    result = await db.execute(
        sql,
        {"embedding": embedding_str, "status": status, "limit": limit},
    )
    rows = result.fetchall()

    jobs = []
    for row in rows:
        jobs.append({
            "id": str(row.id),
            "company_id": str(row.company_id),
            "title": row.title,
            "description": row.description,
            "skills_required": row.skills_required or [],
            "job_type": row.job_type,
            "location": row.location,
            "is_remote": row.is_remote,
            "salary_min": row.salary_min,
            "salary_max": row.salary_max,
            "duration": row.duration,
            "experience_level": row.experience_level,
            "openings": row.openings,
            "deadline": str(row.deadline) if row.deadline else None,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "similarity_score": round(float(row.similarity_score), 4),
        })

    logger.info("vector_search_jobs: returned %d results", len(jobs))
    return jobs


async def update_job(
    db: AsyncSession,
    job_id: str,
    company_id: str,
    **fields: Any,
) -> Optional[Job]:
    """
    Update job fields. Only the owning company can update.

    Pass embedding=new_vector if the description changed and re-embedding is needed.

    Returns:
        Updated Job instance, or None if not found / not owner.
    """
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        return None

    allowed = {
        "title", "description", "skills_required", "job_type", "location",
        "is_remote", "salary_min", "salary_max", "duration", "experience_level",
        "openings", "deadline", "status", "embedding",
    }
    for key, value in fields.items():
        if key in allowed and value is not None:
            setattr(job, key, value)

    await db.flush()
    await db.refresh(job)
    return job


async def delete_job(db: AsyncSession, job_id: str, company_id: str) -> bool:
    """
    Delete a job posting. Only the owning company can delete.

    Returns:
        True if deleted, False if not found / not owner.
    """
    result = await db.execute(
        delete(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    return result.rowcount > 0


async def count_jobs_by_company(db: AsyncSession, company_id: str) -> int:
    """Return the total number of job postings by a company."""
    result = await db.execute(
        select(func.count()).where(Job.company_id == company_id)
    )
    return result.scalar_one() or 0


async def get_jobs_by_ids(
    db: AsyncSession,
    job_ids: List[str],
) -> List[Dict[str, Any]]:
    """
    Batch-fetch job postings by a list of UUIDs, preserving order.

    Used to hydrate FAISS search results: FAISS returns UUIDs, this
    function fetches the full job data in the same ranked order.

    Args:
        db:      Async DB session.
        job_ids: Ordered list of job UUID strings (FAISS result order = rank order).

    Returns:
        List of job dicts in the same order as job_ids.
        Jobs that no longer exist (deleted between index build and query) are omitted.
    """
    if not job_ids:
        return []

    result = await db.execute(
        select(Job).where(Job.id.in_(job_ids))
    )
    jobs_by_id: Dict[str, Job] = {
        str(j.id): j for j in result.scalars().all()
    }

    # Preserve FAISS rank order (most similar first)
    ordered = []
    for rank, job_id in enumerate(job_ids):
        job = jobs_by_id.get(job_id)
        if job:
            ordered.append({
                "id":               str(job.id),
                "company_id":       str(job.company_id),
                "title":            job.title,
                "description":      job.description,
                "skills_required":  job.skills_required or [],
                "job_type":         job.job_type,
                "location":         job.location,
                "is_remote":        job.is_remote,
                "salary_min":       job.salary_min,
                "salary_max":       job.salary_max,
                "duration":         job.duration,
                "experience_level": job.experience_level,
                "openings":         job.openings,
                "deadline":         str(job.deadline) if job.deadline else None,
                "status":           job.status,
                "created_at":       job.created_at.isoformat() if job.created_at else None,
                "similarity_score": round(1.0 - (rank / max(len(job_ids), 1)), 4),
            })

    logger.info("get_jobs_by_ids: returned %d/%d requested jobs", len(ordered), len(job_ids))
    return ordered

