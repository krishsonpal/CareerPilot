"""
CareerPilot — Queue Bridge (Python → BullMQ Worker)

Python FastAPI submits jobs to the Node.js BullMQ worker service via HTTP.
The worker service manages all BullMQ queue operations (retries, priorities,
progress tracking) while Python handles API routing and business logic.

Architecture:
    Python FastAPI  →  POST http://worker:3001/queue/<name>  →  BullMQ  →  AI processing
"""

import logging
from typing import Any, Dict, Optional

import httpx

from utils.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared async HTTP client (reuse connections)
# ---------------------------------------------------------------------------
_http_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    """Return a shared async HTTP client (lazy init)."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            base_url=settings.worker_service_url,
            timeout=httpx.Timeout(10.0, connect=5.0),
        )
    return _http_client


# ---------------------------------------------------------------------------
# Queue submission helpers
# ---------------------------------------------------------------------------

async def enqueue_resume_parse(
    user_id: str,
    file_path: str,
    resume_url: str,
) -> Dict[str, Any]:
    """
    Submit a resume parse job to the BullMQ 'resume-parse' queue.

    The Node.js worker will:
      1. Extract text from PDF/TXT at file_path
      2. Parse structured profile via Gemini
      3. Generate 768-dim embedding
      4. Upsert result into resume_profiles table

    Args:
        user_id:    UUID string of the student.
        file_path:  Absolute path to the saved resume file on disk.
        resume_url: Public URL path (e.g. /static/resumes/user_filename.pdf).

    Returns:
        Dict with task_id and initial status from BullMQ server.
    """
    client = _get_client()
    payload = {"user_id": user_id, "file_path": file_path, "resume_url": resume_url}

    try:
        response = await client.post("/queue/resume-parse", json=payload)
        response.raise_for_status()
        result = response.json()
        logger.info(
            "Enqueued resume-parse — task_id=%s user=%s",
            result.get("task_id"),
            user_id,
        )
        return result
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Worker service returned %d for resume-parse: %s",
            exc.response.status_code,
            exc.response.text,
        )
        raise RuntimeError(
            f"Worker service rejected resume-parse job: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Cannot reach worker service: %s", exc)
        raise RuntimeError(
            "Worker service is unreachable. Is it running on "
            f"{settings.worker_service_url}?"
        ) from exc


async def enqueue_match_score(
    user_id: str,
    job_id: str,
    application_id: str,
) -> Dict[str, Any]:
    """
    Submit a match score computation job to BullMQ 'match-score' queue.

    The Node.js worker will:
      1. Fetch resume profile and job details from PostgreSQL
      2. Call Gemini for AI match score (0-100%)
      3. Update the application row with score + skill arrays

    Args:
        user_id:        UUID string of the student.
        job_id:         UUID string of the job posting.
        application_id: UUID string of the newly created application.

    Returns:
        Dict with task_id and initial status.
    """
    client = _get_client()
    payload = {
        "user_id": user_id,
        "job_id": job_id,
        "application_id": application_id,
    }

    try:
        response = await client.post("/queue/match-score", json=payload)
        response.raise_for_status()
        result = response.json()
        logger.info(
            "Enqueued match-score — task_id=%s application=%s",
            result.get("task_id"),
            application_id,
        )
        return result
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Worker service returned %d for match-score: %s",
            exc.response.status_code,
            exc.response.text,
        )
        raise RuntimeError(
            f"Worker service rejected match-score job: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Cannot reach worker service: %s", exc)
        raise RuntimeError(
            f"Worker service is unreachable: {settings.worker_service_url}"
        ) from exc


async def enqueue_job_embed(
    job_id: str,
    combined_text: str,
) -> Dict[str, Any]:
    """
    Submit a job embedding job to BullMQ 'job-embed' queue.

    The Node.js worker will:
      1. Generate 768-dim Gemini embedding for combined_text
      2. Update jobs.embedding column in PostgreSQL (pgvector)

    Args:
        job_id:        UUID string of the job posting.
        combined_text: Combined title + description + skills text to embed.

    Returns:
        Dict with task_id and initial status.
    """
    client = _get_client()
    payload = {"job_id": job_id, "combined_text": combined_text}

    try:
        response = await client.post("/queue/job-embed", json=payload)
        response.raise_for_status()
        result = response.json()
        logger.info(
            "Enqueued job-embed — task_id=%s job_id=%s",
            result.get("task_id"),
            job_id,
        )
        return result
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Worker service returned %d for job-embed: %s",
            exc.response.status_code,
            exc.response.text,
        )
        raise RuntimeError(
            f"Worker service rejected job-embed job: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Cannot reach worker service for job-embed: %s", exc)
        raise RuntimeError(
            f"Worker service is unreachable: {settings.worker_service_url}"
        ) from exc


async def get_task_status(queue_name: str, task_id: str) -> Dict[str, Any]:
    """
    Poll the BullMQ worker service for a job's current status.

    Args:
        queue_name: One of 'resume-parse', 'match-score', 'job-embed'.
        task_id:    BullMQ job ID returned when the job was enqueued.

    Returns:
        Dict with state, progress, and (if complete) result.
    """
    client = _get_client()

    try:
        response = await client.get(f"/queue/{queue_name}/status/{task_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return {"task_id": task_id, "state": "not_found"}
        raise RuntimeError(
            f"Failed to fetch task status: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Worker service unreachable for status check: {exc}"
        ) from exc
