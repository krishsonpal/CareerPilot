"""
Initial Schema Migration — CareerPilot
Creates all 7 tables for the CareerPilot SaaS platform on Neon DB.

Revision ID: 001
Revises: (initial)
Create Date: 2026-08-08
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# pgvector type for VECTOR columns
from pgvector.sqlalchemy import Vector

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # STEP 0: Enable pgvector extension
    # -----------------------------------------------------------------------
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # -----------------------------------------------------------------------
    # TABLE 1: users
    # -----------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("plan", sa.String(20), server_default="free", nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # -----------------------------------------------------------------------
    # TABLE 2: companies
    # -----------------------------------------------------------------------
    op.create_table(
        "companies",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("plan", sa.String(20), server_default="free", nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_companies_email"),
    )
    op.create_index("ix_companies_email", "companies", ["email"])

    # -----------------------------------------------------------------------
    # TABLE 3: jobs (replaces internships, adds embedding vector)
    # -----------------------------------------------------------------------
    op.create_table(
        "jobs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("skills_required", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("job_type", sa.String(50), server_default="internship", nullable=False),
        sa.Column("location", sa.String(150), nullable=True),
        sa.Column("is_remote", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("duration", sa.String(100), nullable=True),
        sa.Column("experience_level", sa.String(50), nullable=True),
        sa.Column("openings", sa.Integer(), server_default="1", nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        # pgvector VECTOR(768) — Gemini text-embedding-004 output dimension
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["company_id"], ["companies.id"], ondelete="CASCADE", name="fk_jobs_company"
        ),
    )
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])
    # IVFFlat index for fast approximate cosine similarity search
    # lists=100 is good for up to ~1M vectors; adjust for scale
    op.execute(
        "CREATE INDEX ix_jobs_embedding_ivfflat "
        "ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )

    # -----------------------------------------------------------------------
    # TABLE 4: resume_profiles (replaces resume_summaries)
    # -----------------------------------------------------------------------
    op.create_table(
        "resume_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("skills", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("education", postgresql.JSONB(), nullable=True),
        sa.Column("experience", postgresql.JSONB(), nullable=True),
        sa.Column("projects", postgresql.JSONB(), nullable=True),
        # pgvector VECTOR(768) — replaces LargeBinary pickle blob
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("resume_url", sa.Text(), nullable=True),
        sa.Column(
            "last_updated",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_resume_profiles_user"
        ),
        sa.UniqueConstraint("user_id", name="uq_resume_profiles_user_id"),
    )
    op.create_index("ix_resume_profiles_user_id", "resume_profiles", ["user_id"])
    op.execute(
        "CREATE INDEX ix_resume_profiles_embedding_ivfflat "
        "ON resume_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)"
    )

    # -----------------------------------------------------------------------
    # TABLE 5: applications
    # -----------------------------------------------------------------------
    op.create_table(
        "applications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(30), server_default="applied", nullable=False),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.Column("matched_skills", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("missing_skills", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column(
            "applied_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_applications_user"
        ),
        sa.ForeignKeyConstraint(
            ["job_id"], ["jobs.id"], ondelete="CASCADE", name="fk_applications_job"
        ),
        sa.UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_job_id", "applications", ["job_id"])

    # -----------------------------------------------------------------------
    # TABLE 6: chat_sessions (replaces file-based JSON chat history)
    # -----------------------------------------------------------------------
    op.create_table(
        "chat_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(10), nullable=False),    # user | assistant
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_chat_sessions_user"
        ),
    )
    # Compound index for efficient chat history retrieval (user + time order)
    op.create_index(
        "ix_chat_sessions_user_time",
        "chat_sessions",
        ["user_id", sa.text("created_at DESC")],
    )

    # -----------------------------------------------------------------------
    # TABLE 7: skill_market_trends
    # -----------------------------------------------------------------------
    op.create_table(
        "skill_market_trends",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("skill_name", sa.String(150), nullable=False),
        sa.Column("demand_score", sa.Float(), nullable=True),
        sa.Column("growth_trend", sa.String(20), nullable=True),
        sa.Column("avg_salary", sa.Integer(), nullable=True),
        sa.Column("top_companies", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("related_skills", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column(
            "last_computed",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("skill_name", name="uq_skill_market_trends_skill_name"),
    )
    op.create_index("ix_skill_market_trends_skill_name", "skill_market_trends", ["skill_name"])


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""
    op.drop_table("skill_market_trends")
    op.execute("DROP INDEX IF EXISTS ix_chat_sessions_user_time")
    op.drop_table("chat_sessions")
    op.drop_table("applications")
    op.execute("DROP INDEX IF EXISTS ix_resume_profiles_embedding_ivfflat")
    op.drop_table("resume_profiles")
    op.execute("DROP INDEX IF EXISTS ix_jobs_embedding_ivfflat")
    op.drop_table("jobs")
    op.drop_table("companies")
    op.drop_table("users")
