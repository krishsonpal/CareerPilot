"""
CareerPilot — SQLAlchemy ORM Models
Database: Neon DB (PostgreSQL) + pgvector extension

Tables:
  1. users              — Student / Candidate accounts
  2. companies          — Recruiter / Company accounts
  3. jobs               — Job postings (replaces internships)
  4. resume_profiles    — Parsed resume data + embedding vector
  5. applications       — Job applications with match scores
  6. chat_sessions      — Persistent AI chat history per user
  7. skill_market_trends — Computed market demand for skills
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import (
    ARRAY,
    JSONB,
    TIMESTAMP,
    UUID,
)
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship

from db.database import Base


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _uuid_pk():
    """Returns a UUID column configured as primary key with server-side default."""
    return Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )


def _now_tz():
    """Returns current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# 1. users — Student / Candidate accounts
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = _uuid_pk()
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(Text, nullable=True)
    plan = Column(String(20), nullable=False, default="free")  # free | pro | enterprise
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, onupdate=_now_tz, server_default=func.now())

    # Relationships
    resume_profile = relationship("ResumeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan", order_by="ChatSession.created_at")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


# ---------------------------------------------------------------------------
# 2. companies — Recruiter / Company accounts
# ---------------------------------------------------------------------------
class Company(Base):
    __tablename__ = "companies"

    id = _uuid_pk()
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    company_name = Column(String(200), nullable=False)
    website = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    verified = Column(Boolean, nullable=False, default=False)
    plan = Column(String(20), nullable=False, default="free")
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, onupdate=_now_tz, server_default=func.now())

    # Relationships
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Company id={self.id} name={self.company_name}>"


# ---------------------------------------------------------------------------
# 3. jobs — Job / Internship postings
#    embedding VECTOR(768) replaces FAISS local index entirely
# ---------------------------------------------------------------------------
class Job(Base):
    __tablename__ = "jobs"

    id = _uuid_pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(ARRAY(Text), nullable=False, default=list)  # ["Python", "FastAPI", ...]
    job_type = Column(String(50), nullable=False, default="internship")  # internship | full_time | part_time | contract
    location = Column(String(150), nullable=True)
    is_remote = Column(Boolean, nullable=False, default=False)
    salary_min = Column(Integer, nullable=True)   # monthly in INR
    salary_max = Column(Integer, nullable=True)
    duration = Column(String(100), nullable=True)  # e.g. "3 months", "6 months"
    experience_level = Column(String(50), nullable=True)  # fresher | junior | mid | senior
    openings = Column(Integer, nullable=False, default=1)
    deadline = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active | closed | draft

    # pgvector embedding — Gemini text-embedding-004 (768-dim)
    # Used for semantic similarity search via pgvector cosine distance operator (<=>)
    embedding = Column(Vector(768), nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, onupdate=_now_tz, server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Job id={self.id} title={self.title}>"


# ---------------------------------------------------------------------------
# 4. resume_profiles — Parsed resume data + embedding vector
#    Replaces resume_summaries table. No more pickle binary blobs.
# ---------------------------------------------------------------------------
class ResumeProfile(Base):
    __tablename__ = "resume_profiles"

    id = _uuid_pk()
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Raw and summarized resume content
    raw_text = Column(Text, nullable=True)         # Full extracted text from PDF
    summary = Column(Text, nullable=False)          # Gemini-generated professional summary
    skills = Column(ARRAY(Text), nullable=True, default=list)  # ["Python", "React", ...]

    # Structured data extracted by Gemini (stored as JSONB for flexibility)
    education = Column(JSONB, nullable=True)   # [{ degree, institution, year, gpa }]
    experience = Column(JSONB, nullable=True)  # [{ title, company, duration, description }]
    projects = Column(JSONB, nullable=True)    # [{ name, description, tech_stack, link }]

    # pgvector embedding — Gemini text-embedding-004 (768-dim)
    # Used for: semantic job matching, intent-aware recommendations
    embedding = Column(Vector(768), nullable=True)

    processing_status = Column(String(20), nullable=False, default="processing")
    # processing_status values: processing | completed | failed

    resume_url = Column(Text, nullable=True)  # Optional: URL to stored file (S3/cloud)
    last_updated = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now(), onupdate=_now_tz)

    # Relationships
    user = relationship("User", back_populates="resume_profile")

    def __repr__(self) -> str:
        return f"<ResumeProfile user_id={self.user_id}>"


# ---------------------------------------------------------------------------
# 5. applications — Job applications with AI match scoring
# ---------------------------------------------------------------------------
class Application(Base):
    __tablename__ = "applications"

    id = _uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(30), nullable=False, default="applied")
    # Status values: applied | shortlisted | interviewing | rejected | selected

    cover_letter = Column(Text, nullable=True)
    match_score = Column(Float, nullable=True)           # 0.0–100.0 match percentage
    matched_skills = Column(ARRAY(Text), nullable=True, default=list)  # skills user has
    missing_skills = Column(ARRAY(Text), nullable=True, default=list)  # skills gap

    applied_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, onupdate=_now_tz, server_default=func.now())

    # Prevent duplicate applications
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),
    )

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

    def __repr__(self) -> str:
        return f"<Application user={self.user_id} job={self.job_id} status={self.status}>"


# ---------------------------------------------------------------------------
# 6. chat_sessions — Persistent AI chat history per user
#    Replaces file-based FileChatMessageHistory (data/chat_histories/*.json)
# ---------------------------------------------------------------------------
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = _uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    role = Column(String(10), nullable=False)    # "user" | "assistant"
    content = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)   # detected intent for analytics
    # Intent values: recommend_jobs | suggest_skills | market_insight | general

    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_sessions")

    def __repr__(self) -> str:
        return f"<ChatSession user={self.user_id} role={self.role}>"


# ---------------------------------------------------------------------------
# 7. skill_market_trends — Computed market demand for skills
#    Derived from active job postings in the jobs table
# ---------------------------------------------------------------------------
class SkillMarketTrend(Base):
    __tablename__ = "skill_market_trends"

    id = _uuid_pk()
    skill_name = Column(String(150), unique=True, nullable=False, index=True)
    demand_score = Column(Float, nullable=True)         # 0–100 normalized demand
    growth_trend = Column(String(20), nullable=True)    # rising | stable | declining
    avg_salary = Column(Integer, nullable=True)         # average monthly INR
    top_companies = Column(ARRAY(Text), nullable=True, default=list)
    related_skills = Column(ARRAY(Text), nullable=True, default=list)
    last_computed = Column(TIMESTAMP(timezone=True), nullable=False, default=_now_tz, server_default=func.now())

    def __repr__(self) -> str:
        return f"<SkillMarketTrend skill={self.skill_name} score={self.demand_score}>"
