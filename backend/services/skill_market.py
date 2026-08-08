"""
CareerPilot — Skill Market Analysis Service
Analyzes job postings to determine trending skills and market demand.
"""

import logging
from typing import Any, Dict, List

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Job, SkillMarketTrend
from services.gemini_service import analyze_skill_market

logger = logging.getLogger(__name__)


async def compute_market_trends(db: AsyncSession) -> None:
    """
    Background task: Compute skill demand from all active jobs and update the database.
    This aggregates the `skills_required` arrays across all active jobs.
    """
    logger.info("Computing market trends from active job postings...")

    # Fetch all skills required across active jobs
    # This is a bit complex in raw SQL async, so we'll fetch jobs and aggregate in Python
    # for simplicity, or we can use SQLAlchemy's func.unnest if using raw SQL.
    # We will fetch all active jobs for now (assuming manageable scale for MVP).
    
    result = await db.execute(
        select(Job.skills_required)
        .where(Job.status == "active")
    )
    all_skills_arrays = result.scalars().all()

    skill_counts: Dict[str, int] = {}
    total_jobs = len(all_skills_arrays)

    if total_jobs == 0:
        logger.warning("No active jobs to compute trends from.")
        return

    for skills in all_skills_arrays:
        for skill in skills:
            # Normalize skill name (lower, strip)
            s = str(skill).lower().strip()
            if s:
                skill_counts[s] = skill_counts.get(s, 0) + 1

    # Update database
    for skill_name, count in skill_counts.items():
        # Demand score: percentage of jobs requiring this skill (normalized 0-100)
        demand_score = (count / total_jobs) * 100.0

        # Upsert into SkillMarketTrend
        trend_result = await db.execute(
            select(SkillMarketTrend).where(SkillMarketTrend.skill_name == skill_name)
        )
        trend = trend_result.scalar_one_or_none()

        if trend:
            # Update existing
            trend.demand_score = demand_score
        else:
            # Create new
            trend = SkillMarketTrend(
                skill_name=skill_name,
                demand_score=demand_score,
            )
            db.add(trend)

    await db.commit()
    logger.info("Market trends computed for %d unique skills.", len(skill_counts))


async def get_top_trending_skills(db: AsyncSession, limit: int = 10) -> List[SkillMarketTrend]:
    """Fetch the top N most in-demand skills."""
    result = await db.execute(
        select(SkillMarketTrend)
        .order_by(desc(SkillMarketTrend.demand_score))
        .limit(limit)
    )
    return list(result.scalars().all())


async def generate_personalized_skill_roadmap(
    db: AsyncSession,
    user_skills: List[str],
    user_query: str,
) -> Dict[str, Any]:
    """
    Uses Gemini to generate a personalized skill roadmap based on user's current skills
    and current market demand data.

    Returns:
        Dict: trending_skills, priority_for_candidate, market_insights, learning_roadmap
    """
    top_skills_db = await get_top_trending_skills(db, limit=20)
    
    # Format market data for the LLM
    market_data_lines = []
    for s in top_skills_db:
        score = f"{s.demand_score:.1f}" if s.demand_score else "N/A"
        market_data_lines.append(f"- {s.skill_name.title()}: Demand Score {score}/100")
    
    market_demand_str = "\n".join(market_data_lines) if market_data_lines else "No market data available yet."

    # Call Gemini service
    result = analyze_skill_market(
        user_skills=user_skills,
        market_demand_data=market_demand_str,
        user_query=user_query
    )

    return result
