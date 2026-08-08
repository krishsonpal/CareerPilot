"""
CareerPilot — Neon DB Async Database Engine
- Runtime:   asyncpg  (async SQLAlchemy for FastAPI)
- Migrations: psycopg2 (handled by Alembic via sync_database_url)
- Vector:    pgvector extension enabled on first connection
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from utils.config import settings
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# pool_pre_ping: detect stale Neon DB connections (Neon may pause idle compute)
# pool_size/max_overflow: tuned for Render free tier (1 instance, low concurrency)
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=not settings.is_production,  # SQL logging in development only
    connect_args={
        "ssl": "require" if settings.is_production else None,
    }
    if "asyncpg" in settings.database_url
    else {},
)


# ---------------------------------------------------------------------------
# Session Factory
# ---------------------------------------------------------------------------
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ---------------------------------------------------------------------------
# Base Model
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """All ORM models inherit from this base."""
    pass


# ---------------------------------------------------------------------------
# Startup: ensure pgvector extension exists
# ---------------------------------------------------------------------------
async def create_pgvector_extension() -> None:
    """
    Run once at application startup to enable the pgvector extension on
    the Neon DB database. Safe to call multiple times (IF NOT EXISTS).
    """
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        logger.info("✅ pgvector extension ensured on Neon DB")


# ---------------------------------------------------------------------------
# FastAPI Dependency — yields an async DB session per request
# ---------------------------------------------------------------------------
async def get_db() -> AsyncSession:  # type: ignore[return]
    """
    Dependency injected into FastAPI route handlers.
    Automatically commits on success, rolls back on exception.
    Usage:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()