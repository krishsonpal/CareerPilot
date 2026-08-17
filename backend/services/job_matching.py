"""
CareerPilot — Job Matching Service (v3 — FAISS + Multi-Vector Intent Search)

Semantic job matching now uses two complementary strategies:

  Strategy A — Intent-Aware FAISS Search (when a message is provided):
    Builds a composite 768-dim intent vector:
      intent = 0.50 × resume_vec + 0.35 × query_vec + 0.15 × history_vec
    Searches the in-memory FAISS IndexFlatIP for top-k results.
    Hydrates UUIDs back to full job dicts from PostgreSQL.

  Strategy B — Pure Resume pgvector Search (fallback):
    Falls back to pgvector cosine similarity when FAISS is unavailable
    or no user message is provided (e.g., /api/jobs/recommended endpoint).

Match scoring is computed asynchronously by the BullMQ Node.js worker
and is no longer called from within this service.
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from db.crud import jobs, resume
from db.models import ChatSession
from services.faiss_index import faiss_index
from services.intent_vector import build_intent_vector, build_intent_vector_sync
from services.gemini_service import embed_text, extract_json

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Semantic Job Search — Intent-Aware (FAISS) or Resume-Pure (pgvector)
# ---------------------------------------------------------------------------

async def find_matching_jobs(
    db: AsyncSession,
    user_id: str,
    message: Optional[str] = None,
    chat_history: Optional[List[ChatSession]] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Find the top-k jobs that best match the candidate's profile and intent.

    When `message` is provided (chat assistant context), uses Strategy A:
      - Builds a tri-vector composite (resume + query + chat history)
      - Searches in-memory FAISS index for sub-millisecond results
      - Falls back to pgvector if FAISS index is not ready

    When `message` is None (e.g., /recommended endpoint), uses Strategy B:
      - Pure resume vector pgvector cosine search

    Args:
        db:           Async DB session.
        user_id:      UUID of the student.
        message:      Optional current user chat message.
        chat_history: Recent ChatSession rows for history context.
        limit:        Max jobs to return.

    Returns:
        List of job dicts with similarity_score field, ordered best → worst.

    Raises:
        ValueError: If user has no parsed resume profile with an embedding.
    """
    profile = await resume.get_resume_profile(db, user_id)
    if not profile or not profile.embedding:
        raise ValueError(
            "No resume profile found. Upload and process a resume first."
        )

    # ── Strategy A: FAISS multi-vector intent search ─────────────────────────
    if message and faiss_index.is_ready:
        logger.info(
            "[JobMatching] Strategy A — FAISS intent search (message=%d chars, index=%d jobs)",
            len(message), faiss_index.total_jobs
        )
        try:
            intent_vec = await build_intent_vector(
                resume_embedding=profile.embedding,
                user_message=message,
                chat_history=chat_history or [],
            )
            job_uuids = faiss_index.search(intent_vec, k=limit)

            if job_uuids:
                matched = await jobs.get_jobs_by_ids(db, job_uuids)
                logger.info(
                    "[JobMatching] FAISS returned %d results for user=%s", len(matched), user_id
                )
                return matched
            else:
                logger.warning("[JobMatching] FAISS returned 0 results — falling back to pgvector")
        except Exception as exc:
            logger.error("[JobMatching] FAISS search failed (%s) — falling back to pgvector", exc)

    # ── Strategy B: Pure resume pgvector search (fallback) ───────────────────
    logger.info(
        "[JobMatching] Strategy B — pgvector cosine search for user=%s", user_id
    )
    return await jobs.vector_search_jobs(
        db=db,
        query_embedding=profile.embedding,
        limit=limit,
        status="active",
    )


async def search_jobs_by_query(
    db: AsyncSession,
    query: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Semantic job search for natural language queries (public search bar).

    No resume context — uses query embedding only.
    Uses FAISS if available, pgvector as fallback.

    Args:
        db:    Async DB session.
        query: Free-text natural language search (e.g. "Remote ML engineer").
        limit: Max results.

    Returns:
        List of matching job dicts.
    """
    query_embedding = embed_text(query)

    if faiss_index.is_ready:
        logger.info("[JobMatching] Public search via FAISS (query=%r)", query[:50])
        try:
            import numpy as np
            import faiss as _faiss   # noqa: F401

            # Normalise query vec for FAISS
            q_vec = np.array(query_embedding, dtype=np.float32)
            _faiss.normalize_L2(q_vec.reshape(1, -1))

            job_uuids = faiss_index.search(q_vec.tolist(), k=limit)
            if job_uuids:
                return await jobs.get_jobs_by_ids(db, job_uuids)
        except Exception as exc:
            logger.warning("[JobMatching] FAISS public search failed: %s", exc)

    # pgvector fallback
    return await jobs.vector_search_jobs(
        db=db,
        query_embedding=query_embedding,
        limit=limit,
        status="active",
    )


# ---------------------------------------------------------------------------
# 2. Match Score — NOTE: Now handled asynchronously by BullMQ worker
#    This function is kept as a reference/utility only.
#    It is NO LONGER called from application_routes.py.
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
    Calculate an AI-driven match score (synchronous fallback).

    NOTE: In normal operation, this is handled asynchronously by the
    BullMQ matchScore.worker.js. This function is available for:
      - Direct API testing
      - Fallback if worker service is unavailable

    Returns:
        Dict: {"score": float, "matched_skills": list, "missing_skills": list}
    """
    profile = await resume.get_resume_profile(db, user_id)
    if not profile:
        raise ValueError("Candidate profile not found.")

    job = await jobs.get_job_by_id(db, job_id)
    if not job:
        raise ValueError("Job not found.")

    prompt = _SCORING_PROMPT.format(
        job_title=job.title,
        job_description=job.description[:1000],
        job_skills=", ".join(job.skills_required or []),
        candidate_summary=profile.summary,
        candidate_skills=", ".join(profile.skills or []),
        candidate_experience=str(profile.experience)[:1000] if profile.experience else "None",
    )

    result = extract_json(prompt, expected_keys=["score", "matched_skills", "missing_skills"])

    return {
        "score": float(result.get("score", 0.0)),
        "matched_skills": [str(s) for s in result.get("matched_skills", [])],
        "missing_skills": [str(s) for s in result.get("missing_skills", [])],
    }
