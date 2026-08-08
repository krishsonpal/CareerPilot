"""
CareerPilot — Resume Profiles CRUD
Async database operations for the resume_profiles table.
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import ResumeProfile

logger = logging.getLogger(__name__)


async def save_resume_profile(
    db: AsyncSession,
    user_id: str,
    summary: str,
    skills: List[str],
    embedding: List[float],
    raw_text: Optional[str] = None,
    education: Optional[List[Dict]] = None,
    experience: Optional[List[Dict]] = None,
    projects: Optional[List[Dict]] = None,
    resume_url: Optional[str] = None,
) -> ResumeProfile:
    """
    Upsert a resume profile for a user (insert or update if exists).

    Args:
        db:         Async DB session.
        user_id:    UUID of the student user.
        summary:    Gemini-generated professional summary text.
        skills:     List of extracted skill strings.
        embedding:  768-dim float vector from Gemini text-embedding-004.
        raw_text:   Full extracted text from the PDF/TXT file.
        education:  List of education entry dicts.
        experience: List of experience entry dicts.
        projects:   List of project entry dicts.
        resume_url: Optional URL to stored resume file.

    Returns:
        Saved/updated ResumeProfile ORM instance.
    """
    # Check if a profile already exists for this user
    result = await db.execute(
        select(ResumeProfile).where(ResumeProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        # Update existing profile
        profile.summary = summary
        profile.skills = skills
        profile.embedding = embedding
        if raw_text is not None:
            profile.raw_text = raw_text
        if education is not None:
            profile.education = education
        if experience is not None:
            profile.experience = experience
        if projects is not None:
            profile.projects = projects
        if resume_url is not None:
            profile.resume_url = resume_url
        logger.info("save_resume_profile: updated profile for user=%s", user_id)
    else:
        # Create new profile
        profile = ResumeProfile(
            user_id=user_id,
            summary=summary,
            skills=skills,
            embedding=embedding,
            raw_text=raw_text,
            education=education or [],
            experience=experience or [],
            projects=projects or [],
            resume_url=resume_url,
        )
        db.add(profile)
        logger.info("save_resume_profile: created new profile for user=%s", user_id)

    await db.flush()
    await db.refresh(profile)
    return profile


async def get_resume_profile(
    db: AsyncSession, user_id: str
) -> Optional[ResumeProfile]:
    """
    Fetch a user's resume profile including embedding vector.

    Returns:
        ResumeProfile if found, None if the user has not uploaded a resume yet.
    """
    result = await db.execute(
        select(ResumeProfile).where(ResumeProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def has_resume(db: AsyncSession, user_id: str) -> bool:
    """Check whether a user has an uploaded and processed resume."""
    profile = await get_resume_profile(db, user_id)
    return profile is not None and bool(profile.summary)
