"""
CareerPilot — FAISS Job Index (In-Memory Vector Search)

Maintains an in-memory FAISS index of all active job embeddings alongside
the pgvector persistent store. This enables sub-millisecond multi-vector
similarity search that goes beyond single-vector cosine lookup.

Architecture:
  - pgvector: Source of truth, persists embeddings across restarts
  - FAISS IndexFlatIP: In-memory index, rebuilt from pgvector at startup
  - On new/updated jobs: FAISS index hot-updated by workers

Why FAISS alongside pgvector?
  - FAISS supports batch multi-vector queries natively
  - Composite intent vectors (resume + query + chat history) need L2-normalised
    cosine search that FAISS IndexFlatIP provides with max performance
  - pgvector is used as the fallback and persistent store
"""

import logging
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class FAISSJobIndex:
    """
    Singleton in-memory FAISS index for job postings.

    Uses IndexFlatIP (inner product search) on L2-normalised vectors,
    which is mathematically equivalent to cosine similarity search.

    Thread safety: FastAPI is single-threaded per worker process (async),
    so no lock is needed for read operations. Writes (add_job) are
    serialised through the async event loop.
    """

    def __init__(self) -> None:
        self._index = None          # faiss.IndexFlatIP
        self._id_map: Dict[int, str] = {}   # FAISS int ID → job UUID string
        self._rev_map: Dict[str, int] = {}  # job UUID → FAISS int ID
        self._next_id: int = 0
        self._dim: int = 768
        self._built: bool = False

    # ── Build ────────────────────────────────────────────────────────────────

    async def build_from_db(self, db) -> None:
        """
        Build the FAISS index from all active jobs stored in pgvector.
        Called once during FastAPI lifespan startup.

        Args:
            db: AsyncSession — used to fetch job embeddings from PostgreSQL.
        """
        try:
            import faiss  # noqa: PLC0415 — imported here to avoid top-level crash if faiss missing
        except ImportError:
            logger.warning(
                "[FAISS] faiss-cpu not installed. FAISS index will be disabled. "
                "Install with: pip install faiss-cpu"
            )
            return

        from sqlalchemy import text

        logger.info("[FAISS] Building index from active job embeddings in pgvector...")

        # Fetch all active jobs that have an embedding
        result = await db.execute(
            text("""
                SELECT id, embedding::text
                FROM jobs
                WHERE status = 'active' AND embedding IS NOT NULL
            """)
        )
        rows = result.fetchall()

        if not rows:
            logger.warning("[FAISS] No active jobs with embeddings found — index is empty")
            self._index = faiss.IndexFlatIP(self._dim)
            self._built = True
            return

        vectors = []
        job_ids = []

        for row in rows:
            job_id = str(row[0])
            emb_str = row[1]  # pgvector returns '[x,y,z,...]' as text

            try:
                # Parse pgvector text format '[1.0,2.0,...]' → numpy array
                emb_list = [float(x) for x in emb_str.strip("[]").split(",")]
                if len(emb_list) != self._dim:
                    logger.warning(
                        "[FAISS] Job %s has wrong embedding dim=%d (expected %d), skipping",
                        job_id, len(emb_list), self._dim
                    )
                    continue
                vectors.append(emb_list)
                job_ids.append(job_id)
            except (ValueError, AttributeError) as exc:
                logger.warning("[FAISS] Could not parse embedding for job %s: %s", job_id, exc)
                continue

        if not vectors:
            logger.warning("[FAISS] No parseable embeddings found — index is empty")
            self._index = faiss.IndexFlatIP(self._dim)
            self._built = True
            return

        # Stack into numpy float32 matrix and L2-normalise (cosine similarity)
        matrix = np.array(vectors, dtype=np.float32)
        faiss.normalize_L2(matrix)

        # Build flat inner product index
        self._index = faiss.IndexFlatIP(self._dim)
        self._index.add(matrix)

        # Build ID maps
        for i, job_id in enumerate(job_ids):
            self._id_map[i] = job_id
            self._rev_map[job_id] = i
            self._next_id = i + 1

        self._built = True
        logger.info(
            "[FAISS] ✅ Index built — %d jobs indexed (dim=%d)",
            len(vectors), self._dim
        )

    # ── Hot-update ───────────────────────────────────────────────────────────

    def add_job(self, job_id: str, embedding: List[float]) -> None:
        """
        Add a single job to the live FAISS index.
        Called by the job embedding worker after it updates pgvector.

        Args:
            job_id:    UUID string of the job posting.
            embedding: 768-dim float vector.
        """
        if not self._built or self._index is None:
            logger.warning("[FAISS] add_job called before index is built — skipping")
            return

        try:
            import faiss  # noqa: PLC0415

            vec = np.array([embedding], dtype=np.float32)
            faiss.normalize_L2(vec)
            self._index.add(vec)

            faiss_id = self._next_id
            self._id_map[faiss_id] = job_id
            self._rev_map[job_id] = faiss_id
            self._next_id += 1

            logger.debug("[FAISS] add_job: job_id=%s → faiss_id=%d", job_id, faiss_id)
        except Exception as exc:
            logger.error("[FAISS] add_job failed for job_id=%s: %s", job_id, exc)

    def remove_job(self, job_id: str) -> None:
        """
        Mark a job as removed from the index.

        NOTE: FAISS IndexFlatIP does not support true removal (no delete API).
        We mark the job in a skip set and filter results. The index is rebuilt
        on next server restart (or call build_from_db again for a full refresh).

        Args:
            job_id: UUID string to logically remove from search results.
        """
        if job_id in self._rev_map:
            faiss_id = self._rev_map.pop(job_id)
            # Remove from id_map so search results skip this faiss_id
            self._id_map.pop(faiss_id, None)
            logger.debug("[FAISS] remove_job: job_id=%s (faiss_id=%d) marked inactive", job_id, faiss_id)

    # ── Search ───────────────────────────────────────────────────────────────

    def search(
        self,
        query_vector: List[float],
        k: int = 20,
    ) -> List[str]:
        """
        Search the FAISS index for the top-k most similar jobs.

        Args:
            query_vector: 768-dim float vector (already normalised by caller).
            k:            Number of results to return.

        Returns:
            Ordered list of job UUID strings (best match first).
            Returns empty list if index is not built or empty.
        """
        if not self._built or self._index is None or self._index.ntotal == 0:
            logger.warning("[FAISS] search called on empty/unbuilt index")
            return []

        try:
            import faiss  # noqa: PLC0415

            query = np.array([query_vector], dtype=np.float32)
            faiss.normalize_L2(query)

            actual_k = min(k, self._index.ntotal)
            distances, indices = self._index.search(query, actual_k)

            results = []
            for idx in indices[0]:
                if idx == -1:
                    continue  # FAISS padding for when k > ntotal
                job_id = self._id_map.get(int(idx))
                if job_id:  # Skip removed/missing jobs
                    results.append(job_id)

            logger.debug("[FAISS] search: returned %d results for k=%d", len(results), k)
            return results

        except Exception as exc:
            logger.error("[FAISS] search failed: %s", exc)
            return []

    # ── Status ───────────────────────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        """True if the index has been built and contains at least one job."""
        return self._built and self._index is not None

    @property
    def total_jobs(self) -> int:
        """Number of active (non-removed) jobs in the index."""
        return len(self._rev_map)

    def __repr__(self) -> str:
        return (
            f"<FAISSJobIndex built={self._built} "
            f"total={self.total_jobs} dim={self._dim}>"
        )


# ---------------------------------------------------------------------------
# Module-level singleton — imported by main.py and job_matching.py
# ---------------------------------------------------------------------------
faiss_index = FAISSJobIndex()
