"""
CareerPilot — Application Configuration
Reads from environment variables only.
Google Gemini is the ONLY AI provider — no fallbacks.
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # ------------------------------------------------------------------
    # App Metadata
    # ------------------------------------------------------------------
    app_name: str = Field(default="CareerPilot", alias="APP_NAME")
    app_version: str = Field(default="3.0.0", alias="APP_VERSION")
    app_env: str = Field(default="development", alias="APP_ENV")

    # ------------------------------------------------------------------
    # Neon DB — PostgreSQL Connection
    # Format (async/runtime):
    #   postgresql+asyncpg://user:pass@host/db?sslmode=require
    # ------------------------------------------------------------------
    database_url: str = Field(..., alias="DATABASE_URL")

    # ------------------------------------------------------------------
    # Google Gemini API — ONLY AI provider, no fallback
    # ------------------------------------------------------------------
    google_api_key: str = Field(..., alias="GOOGLE_API_KEY")
    gemini_llm_model: str = Field(default="gemini-flash-latest", alias="GEMINI_LLM_MODEL")
    gemini_embedding_model: str = Field(
        default="models/gemini-embedding-001", alias="GEMINI_EMBEDDING_MODEL"
    )
    gemini_embedding_dim: int = Field(default=768, alias="GEMINI_EMBEDDING_DIM")

    # ------------------------------------------------------------------
    # JWT Authentication
    # ------------------------------------------------------------------
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=10080, alias="JWT_EXPIRE_MINUTES")  # 7 days

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    # ------------------------------------------------------------------
    # File Uploads
    # ------------------------------------------------------------------
    upload_dir: str = Field(default="./temp_uploads", alias="UPLOAD_DIR")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")

    # ------------------------------------------------------------------
    # BullMQ Worker Service
    # The Node.js BullMQ worker exposes an HTTP server on this URL.
    # Python submits jobs here rather than pushing to Redis directly,
    # giving us full BullMQ queue management (retries, priorities, progress).
    # ------------------------------------------------------------------
    worker_service_url: str = Field(
        default="http://localhost:3001", alias="WORKER_SERVICE_URL"
    )

    # ------------------------------------------------------------------
    # Render deployment — server port (Render injects PORT automatically)
    # ------------------------------------------------------------------
    port: int = Field(default=8000, alias="PORT")

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def sync_database_url(self) -> str:
        """
        Return a synchronous psycopg2 URL for Alembic migrations.
        Replaces asyncpg driver with psycopg2 in the connection string.
        """
        url = self.database_url.replace(
            "postgresql+asyncpg://", "postgresql+psycopg2://"
        ).replace(
            "postgres+asyncpg://", "postgresql+psycopg2://"
        ).replace(
            "?ssl=require", ""  # Remove if present (handled separately)
        )
        # Always append sslmode=require for psycopg2 (Neon DB requires SSL)
        if "?" not in url:
            return url + "?sslmode=require"
        return url + "&sslmode=require"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
        "extra": "ignore",
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()  # type: ignore[call-arg]


# Module-level convenience accessor
settings = get_settings()
