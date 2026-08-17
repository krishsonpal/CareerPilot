"""
CareerPilot — FastAPI Application Entry Point (v3.0)

Startup sequence:
  1. Enable pgvector extension on Neon DB
  2. Build in-memory FAISS job index from pgvector embeddings
  3. Register all API routers

Real-time streaming (Phase 3) will mount Socket.IO here.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os

import socketio

from utils.config import settings
from db.database import create_pgvector_extension, get_db
from services.faiss_index import faiss_index
from sockets.chat_socket import sio  # Import Socket.IO server

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: runs once at startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info("🚀 Starting %s v%s", settings.app_name, settings.app_version)
    logger.info("   Environment : %s", settings.app_env)

    # Step 1: Ensure pgvector extension is enabled on Neon DB
    await create_pgvector_extension()

    # Step 2: Build FAISS in-memory index from pgvector job embeddings
    logger.info("[FAISS] Building in-memory job index from pgvector...")
    try:
        async for db in get_db():
            await faiss_index.build_from_db(db)
            break  # We only need one DB session for the build
        logger.info(
            "[FAISS] ✅ Index ready — %d jobs indexed", faiss_index.total_jobs
        )
    except Exception as exc:
        # Non-fatal: FAISS index failure degrades to pgvector-only search
        logger.warning(
            "[FAISS] ⚠️  Index build failed: %s — falling back to pgvector-only search", exc
        )

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
        "semantic job matching via FAISS multi-vector intent search, "
        "async AI processing via BullMQ/Redis, and real-time chat streaming."
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
# Static Files (Resume PDFs)
# ---------------------------------------------------------------------------
os.makedirs(os.path.join(os.getcwd(), "static", "resumes"), exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/healthz", tags=["Health"])
async def health_check():
    """Health check endpoint — includes FAISS index status."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "env": settings.app_env,
        "faiss_index": {
            "ready": faiss_index.is_ready,
            "total_jobs": faiss_index.total_jobs,
        },
    }


@app.get("/api/version", tags=["Health"])
async def api_version():
    """Returns API version and infrastructure metadata."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "database": "Neon DB (PostgreSQL + pgvector)",
        "ai_provider": "Google Gemini",
        "vector_search": {
            "primary": "FAISS IndexFlatIP (in-memory, multi-vector intent)",
            "fallback": "pgvector cosine similarity",
            "faiss_ready": faiss_index.is_ready,
            "indexed_jobs": faiss_index.total_jobs,
        },
        "async_queue": {
            "worker": "BullMQ (Node.js)",
            "broker": "Redis",
            "worker_url": settings.worker_service_url,
        },
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

# ---------------------------------------------------------------------------
# Socket.IO — Wrap FastAPI with Socket.IO ASGI application
# Both REST endpoints (http) and WebSocket chat (ws) run on the same port.
# The socket.io client connects to ws://host:8000/socket.io/
# ---------------------------------------------------------------------------

# Resolve CORS origins from settings for Socket.IO
_sio_cors_origins = settings.cors_origins if settings.cors_origins else ["*"]
sio.cors_allowed_origins = _sio_cors_origins

# Wrap FastAPI app — this is the actual ASGI application served by uvicorn
application = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app,
    socketio_path="/socket.io",  # Standard path expected by socket.io-client
)

