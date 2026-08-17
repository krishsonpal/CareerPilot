"""
CareerPilot — Multi-Vector Intent Embedding Builder

Constructs a composite query vector that blends three signals:
  1. Resume vector    (50%) — who the candidate is
  2. Message vector   (35%) — what they're asking for right now
  3. Chat history     (15%) — conversational context from recent turns

This tri-vector approach produces intent-aware semantic matches that go
significantly beyond single-vector resume similarity. When a candidate
with a Python background says "I want remote JavaScript roles", the
intent vector shifts toward JS jobs even though their resume says Python.

Usage:
    from services.intent_vector import build_intent_vector

    intent_vec = await build_intent_vector(
        resume_embedding=profile.embedding,
        user_message="I want remote JavaScript internships",
        chat_history=recent_sessions,
    )
    job_ids = faiss_index.search(intent_vec, k=10)
"""

import logging
from typing import List, Optional, Tuple

import numpy as np

from db.models import ChatSession
from services.gemini_service import embed_text

logger = logging.getLogger(__name__)

# Default blending weights: (resume, query, history)
DEFAULT_WEIGHTS: Tuple[float, float, float] = (0.50, 0.35, 0.15)


async def build_intent_vector(
    resume_embedding: List[float],
    user_message: str,
    chat_history: Optional[List[ChatSession]] = None,
    weights: Tuple[float, float, float] = DEFAULT_WEIGHTS,
) -> List[float]:
    """
    Build a composite intent vector from three weighted sources.

    The resulting vector is L2-normalised, making it directly compatible
    with FAISS IndexFlatIP cosine search (inner product on unit vectors = cosine).

    Args:
        resume_embedding: 768-dim vector from ResumeProfile.embedding.
        user_message:     The candidate's current chat message.
        chat_history:     Recent ChatSession rows for context (optional).
        weights:          (w_resume, w_query, w_history) — must sum to 1.0.

    Returns:
        768-dim L2-normalised float list ready for FAISS search.

    Raises:
        RuntimeError: If Gemini embedding call fails (wraps original exception).
    """
    w_resume, w_query, w_history = weights

    # ── 1. Resume vector ─────────────────────────────────────────────────────
    resume_vec = np.array(resume_embedding, dtype=np.float64)

    # ── 2. User query vector ─────────────────────────────────────────────────
    try:
        query_embedding = embed_text(user_message)
        query_vec = np.array(query_embedding, dtype=np.float64)
        logger.debug(
            "[IntentVector] Embedded user message (%d chars) → dim=%d",
            len(user_message), len(query_embedding)
        )
    except Exception as exc:
        logger.warning(
            "[IntentVector] Query embedding failed (%s) — falling back to resume-only vector", exc
        )
        # Graceful degrade: use pure resume vector
        normed = resume_vec / (np.linalg.norm(resume_vec) + 1e-8)
        return normed.tolist()

    # ── 3. Chat history context vector ───────────────────────────────────────
    history_vec = np.zeros(768, dtype=np.float64)

    if chat_history:
        # Take the last 3 assistant messages as context
        assistant_msgs = [
            s for s in chat_history if s.role in ("assistant", "model")
        ][-3:]

        if assistant_msgs:
            embedded_history = []
            for msg in assistant_msgs:
                try:
                    vec = embed_text(msg.content[:500])  # Truncate long messages
                    embedded_history.append(np.array(vec, dtype=np.float64))
                except Exception as exc:
                    logger.debug(
                        "[IntentVector] Skipping history message embed: %s", exc
                    )
                    continue

            if embedded_history:
                history_vec = np.mean(embedded_history, axis=0)
                logger.debug(
                    "[IntentVector] Built history vector from %d assistant messages",
                    len(embedded_history)
                )

    # ── 4. Weighted composite ────────────────────────────────────────────────
    composite = (
        w_resume * resume_vec
        + w_query  * query_vec
        + w_history * history_vec
    )

    # ── 5. L2-normalise for cosine similarity ─────────────────────────────────
    norm = np.linalg.norm(composite)
    if norm < 1e-8:
        logger.warning("[IntentVector] Composite vector has near-zero norm — using resume fallback")
        norm = np.linalg.norm(resume_vec) + 1e-8
        composite = resume_vec

    normalised = composite / norm

    logger.info(
        "[IntentVector] Built composite vector — weights=(%.2f, %.2f, %.2f) norm=%.4f",
        w_resume, w_query, w_history, float(norm)
    )

    return normalised.tolist()


def build_intent_vector_sync(
    resume_embedding: List[float],
    query_embedding: List[float],
    weights: Tuple[float, float, float] = (0.65, 0.35, 0.0),
) -> List[float]:
    """
    Synchronous variant — used when query embedding is already computed.
    No chat history context, useful for the /api/jobs/recommended endpoint.

    Args:
        resume_embedding: 768-dim vector.
        query_embedding:  768-dim vector (pre-computed).
        weights:          (w_resume, w_query, 0) — history weight unused here.

    Returns:
        768-dim L2-normalised float list.
    """
    w_resume, w_query, _ = weights
    resume_vec = np.array(resume_embedding, dtype=np.float64)
    query_vec  = np.array(query_embedding,  dtype=np.float64)

    composite = w_resume * resume_vec + w_query * query_vec
    norm = np.linalg.norm(composite) + 1e-8
    return (composite / norm).tolist()
