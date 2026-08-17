"""
CareerPilot — AI Career Assistant & Recommendation Engine
Handles context-aware chat, intent detection, and dynamic recommendations.
"""

import logging
from typing import Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.crud import resume
from db.models import ChatSession
from services.gemini_service import chat_complete, detect_intent
from services.job_matching import find_matching_jobs
from services.skill_market import generate_personalized_skill_roadmap

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Chat History Management
# ---------------------------------------------------------------------------
async def _save_chat_message(
    db: AsyncSession,
    user_id: str,
    role: str,
    content: str,
    intent: str = None
) -> None:
    """Save a message to the persistent chat history."""
    msg = ChatSession(
        user_id=user_id,
        role=role,
        content=content,
        intent=intent
    )
    db.add(msg)
    await db.commit()


async def get_chat_history(db: AsyncSession, user_id: str, limit: int = 10) -> List[Dict[str, str]]:
    """Retrieve recent chat history as formatted dicts for Gemini messages."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )
    sessions = list(reversed(result.scalars().all()))
    return [{"role": s.role, "content": s.content} for s in sessions]


async def get_chat_history_raw(
    db: AsyncSession, user_id: str, limit: int = 10
) -> List[ChatSession]:
    """
    Retrieve recent ChatSession ORM objects.
    Used by the intent vector builder to embed historical assistant messages
    as context for FAISS multi-vector search.
    """
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))



# ---------------------------------------------------------------------------
# AI Assistant Agent
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """\
You are CareerPilot, an advanced AI career assistant.
You help candidates find jobs, improve their skills, and navigate the job market.
Be concise, professional, encouraging, and highly technical.
Format responses using markdown.

Candidate Context:
{context}
"""

async def process_user_message(
    db: AsyncSession,
    user_id: str,
    message: str
) -> Dict[str, Any]:
    """
    Main entry point for the AI Career Assistant chat.
    Detects intent, performs actions (if needed), and generates a response.
    """
    # 1. Detect Intent
    intent = detect_intent(message)
    logger.info("process_user_message: Detected intent '%s' for user=%s", intent, user_id)

    # 2. Save user message
    await _save_chat_message(db, user_id, "user", message, intent)

    # 3. Gather Context
    profile = await resume.get_resume_profile(db, user_id)
    history = await get_chat_history(db, user_id, limit=5)
    history_raw = await get_chat_history_raw(db, user_id, limit=5)

    context_str = "No resume uploaded yet."
    if profile:
        context_str = f"Summary: {profile.summary}\nSkills: {', '.join(profile.skills or [])}"

    # 4. Handle Specific Intents with Tools/Data
    extra_context = ""

    
    if intent == "recommend_jobs" and profile:
        try:
            # FAISS tri-vector intent search: uses resume + message + chat history
            matches = await find_matching_jobs(
                db=db,
                user_id=user_id,
                message=message,
                chat_history=history_raw if history_raw else None,
                limit=3,
            )
            if matches:
                jobs_info = []
                for m in matches:
                    jobs_info.append(
                        f"- {m['title']} ({m.get('job_type','')}, {m.get('location','')}) "
                        f"— Match: {m['similarity_score']*100:.0f}%"
                    )
                extra_context = "\nTop matching jobs based on your profile and query:\n" + "\n".join(jobs_info)
            else:
                extra_context = "\nNo active job postings matched your profile right now."
        except Exception as e:
            logger.error("Job matching failed during chat: %s", e)

    elif intent == "market_insight" or intent == "suggest_skills":
        if profile:
            try:
                roadmap = await generate_personalized_skill_roadmap(
                    db=db,
                    user_skills=profile.skills,
                    user_query=message
                )
                extra_context = "\nMarket Analysis Data:\n" + str(roadmap)
            except Exception as e:
                logger.error("Market analysis failed during chat: %s", e)

    # 5. Generate LLM Response
    system_prompt = _SYSTEM_PROMPT.format(context=context_str)
    if extra_context:
        system_prompt += "\n" + extra_context
        system_prompt += "\nUse the data above to answer the user's question directly."

    # History already includes the user's latest message, but we pass it formatted for Gemini
    # Ensure history is in the correct format for Gemini (alternating user/model)
    gemini_messages = []
    for msg in history:
        gemini_messages.append({"role": msg["role"], "content": msg["content"]})
    
    # If the history doesn't include the current message (due to transaction state), add it
    if not gemini_messages or gemini_messages[-1]["content"] != message:
        gemini_messages.append({"role": "user", "content": message})

    response_text = chat_complete(
        messages=gemini_messages,
        system_prompt=system_prompt,
        temperature=0.4
    )

    # 6. Save assistant response
    await _save_chat_message(db, user_id, "assistant", response_text, intent)

    return {
        "response": response_text,
        "intent": intent
    }
