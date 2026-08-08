"""
CareerPilot — Job Matching Service
Handles semantic search and AI-driven match scoring.
Replaces the old FAISS recommendation system.
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from db.crud import jobs, resume
from db.models import Job, ResumeProfile
from services.gemini_service import chat_complete, embed_text

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Semantic Job Search (pgvector)
# ---------------------------------------------------------------------------
async def find_matching_jobs(
    db: AsyncSession,
    user_id: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Find jobs that match the user's resume semantically.
    Uses pgvector cosine similarity on the 768-dim embeddings.

    Args:
        db:       Async DB session.
        user_id:  UUID of the student.
        limit:    Max jobs to return.

    Returns:
        List of matching job dicts (includes similarity_score).

    Raises:
        ValueError: If user has no resume profile.
    """
    profile = await resume.get_resume_profile(db, user_id)
    if not profile or not profile.embedding:
        raise ValueError("User has no parsed resume or embedding. Upload a resume first.")

    # pgvector raw SQL search
    matching_jobs = await jobs.vector_search_jobs(
        db=db,
        query_embedding=profile.embedding,
        limit=limit,
        status="active",
    )

    return matching_jobs


async def search_jobs_by_query(
    db: AsyncSession,
    query: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Find jobs matching a natural language query.
    E.g. "Remote Python developer roles with startup vibe"

    Args:
        db:    Async DB session.
        query: Free-text search query.
        limit: Max jobs to return.

    Returns:
        List of matching job dicts.
    """
    # Embed the search query directly via Gemini
    query_vector = embed_text(query)

    matching_jobs = await jobs.vector_search_jobs(
        db=db,
        query_embedding=query_vector,
        limit=limit,
        status="active",
    )

    return matching_jobs


# ---------------------------------------------------------------------------
# 2. AI Match Scoring (Gemini LLM)
# ---------------------------------------------------------------------------
_SCORING_PROMPT = """\
You are an expert technical recruiter evaluating a candidate for a job.

Job Requirements:
Title: {job_title}
Description: {job_description}
Required Skills: {job_skills}

Candidate Profile:
Summary: {candidate_summary}
Candidate Skills: {candidate_skills}
Experience: {candidate_experience}

Evaluate the match and provide a score from 0.0 to 100.0.
List the exact skills the candidate has that match the job.
List the exact skills required by the job that the candidate is missing.

Respond in strict JSON format:
{{
    "score": 85.5,
    "matched_skills": ["skill1", "skill2"],
    "missing_skills": ["skill3"]
}}
"""


async def calculate_match_score(
    db: AsyncSession,
    user_id: str,
    job_id: str,
) -> Dict[str, Any]:
    """
    Calculate an AI-driven match score between a candidate and a job.
    Uses Gemini LLM for deep reasoning beyond simple vector similarity.

    Returns:
        Dict: {"score": float, "matched_skills": list, "missing_skills": list}

    Raises:
        ValueError: If user profile or job is not found.
    """
    # Fetch Data
    profile = await resume.get_resume_profile(db, user_id)
    if not profile:
        raise ValueError("Candidate profile not found.")

    job = await jobs.get_job_by_id(db, job_id)
    if not job:
        raise ValueError("Job not found.")

    # We use chat_complete instead of extract_json directly because we can instruct
    # the LLM to just output the JSON, but since extract_json is more robust for this:
    from services.gemini_service import extract_json

    prompt = _SCORING_PROMPT.format(
        job_title=job.title,
        job_description=job.description[:1000], # truncate to save tokens
        job_skills=", ".join(job.skills_required or []),
        candidate_summary=profile.summary,
        candidate_skills=", ".join(profile.skills or []),
        candidate_experience=str(profile.experience)[:1000] if profile.experience else "None",
    )

    result = extract_json(prompt, expected_keys=["score", "matched_skills", "missing_skills"])

    # Ensure types
    return {
        "score": float(result.get("score", 0.0)),
        "matched_skills": [str(s) for s in result.get("matched_skills", [])],
        "missing_skills": [str(s) for s in result.get("missing_skills", [])],
    }
