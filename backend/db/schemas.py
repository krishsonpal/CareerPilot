"""
CareerPilot — Pydantic Schemas (v2)
Data validation for API requests and responses.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ===========================================================================
# Base Config (Pydantic v2 replaces orm_mode=True with from_attributes=True)
# ===========================================================================
class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Users (Students)
# ===========================================================================
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    phone: Optional[str] = None


class UserResponse(ORMBase):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    plan: str
    created_at: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# ===========================================================================
# Companies (Recruiters)
# ===========================================================================
class CompanyCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None


class CompanyResponse(ORMBase):
    id: UUID
    email: EmailStr
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    verified: bool
    plan: str
    created_at: datetime


# ===========================================================================
# Jobs / Internships
# ===========================================================================
class JobCreate(BaseModel):
    title: str
    description: str
    skills_required: List[str]
    job_type: str = "internship"
    location: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration: Optional[str] = None
    experience_level: Optional[str] = None
    openings: int = 1
    deadline: Optional[date] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skills_required: Optional[List[str]] = None
    job_type: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration: Optional[str] = None
    experience_level: Optional[str] = None
    openings: Optional[int] = None
    deadline: Optional[date] = None
    status: Optional[str] = None


class JobResponse(ORMBase):
    id: UUID
    company_id: UUID
    title: str
    description: str
    skills_required: List[str]
    job_type: str
    location: Optional[str] = None
    is_remote: bool
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration: Optional[str] = None
    experience_level: Optional[str] = None
    openings: int
    deadline: Optional[date] = None
    status: str
    created_at: datetime

    # Only present if this was a vector search result
    similarity_score: Optional[float] = None


class JobSearchResponse(BaseModel):
    jobs: List[JobResponse]
    total: int


# ===========================================================================
# Applications
# ===========================================================================
class ApplicationApply(BaseModel):
    job_id: UUID
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationResponse(ORMBase):
    id: UUID
    user_id: UUID
    job_id: UUID
    status: str
    cover_letter: Optional[str] = None
    match_score: Optional[float] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    applied_at: datetime
    updated_at: datetime


class ApplicationWithJobResponse(ApplicationResponse):
    job: JobResponse


# ===========================================================================
# Resume Profiles
# ===========================================================================
class ResumeProfileResponse(ORMBase):
    user_id: UUID
    summary: str
    skills: List[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    resume_url: Optional[str] = None
    last_updated: datetime


# ===========================================================================
# AI Chat & Recommendations
# ===========================================================================
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: Optional[str] = None


class MarketInsightResponse(BaseModel):
    trending_skills: List[str]
    priority_for_candidate: List[str]
    market_insights: str
    learning_roadmap: List[Dict[str, str]]
