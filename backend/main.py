"""
CareerPilot — FastAPI Application Entry Point
Phase 1: Foundation stub — routes will be added in Phase 4
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from utils.config import settings
from db.database import create_pgvector_extension

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: runs once at startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"   Environment : {settings.app_env}")

    # Ensure pgvector extension is enabled on Neon DB
    await create_pgvector_extension()

    logger.info("✅ Startup complete — CareerPilot is ready")
    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("👋 Shutting down CareerPilot")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-Powered Recruitment & Career Platform — "
        "semantic job matching, career guidance, and market-aware skill recommendations."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/healthz", tags=["Health"])
async def health_check():
    """Render health check endpoint — returns 200 if server is up."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "env": settings.app_env,
    }


@app.get("/api/version", tags=["Health"])
async def api_version():
    """Returns API version metadata."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "database": "Neon DB (PostgreSQL + pgvector)",
        "ai_provider": "Google Gemini",
    }


# ---------------------------------------------------------------------------
# API Routers
# ---------------------------------------------------------------------------
from routes.auth_routes import router as auth_router
from routes.job_routes import router as job_router
from routes.application_routes import router as app_router
from routes.ai_routes import router as ai_router
from routes.recruiter_routes import router as recruiter_router

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(job_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(app_router, prefix="/api/applications", tags=["Applications"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(recruiter_router, prefix="/api/recruiter", tags=["Recruiter"])
