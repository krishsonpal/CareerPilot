"""
CareerPilot — LangChain Streaming Generator

Streams Gemini LLM responses token-by-token using LangChain's async
streaming interface (astream). Tokens are yielded to the Socket.IO
event handler which emits them to the client in real-time.

Flow:
  1. Detect intent from user message
  2. Fetch resume profile + chat history from DB
  3. If recommend_jobs intent → FAISS intent-vector search → format as context
  4. Build LangChain message list with system prompt + context
  5. Stream tokens via ChatGoogleGenerativeAI.astream()
  6. After stream completes → persist full response to chat_sessions

Why LangChain streaming instead of raw Gemini SDK?
  - LangChain's ChatGoogleGenerativeAI.astream() yields clean token chunks
  - Provides a unified interface regardless of underlying provider
  - Already in requirements.txt (langchain-google-genai)
"""

import logging
from typing import AsyncGenerator, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from db.crud import resume
from db.database import get_db
from services.gemini_service import detect_intent
from services.job_matching import find_matching_jobs
from services.recommendation import _save_chat_message, get_chat_history, get_chat_history_raw
from utils.config import settings
from utils.auth import decode_token

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# System prompt for the streaming assistant
# ---------------------------------------------------------------------------
_STREAMING_SYSTEM_PROMPT = """\
You are CareerPilot, an advanced AI career assistant powered by cutting-edge AI.
Help candidates find jobs, improve their skills, and navigate the competitive job market.
Be concise, professional, encouraging, and technically precise.
Format all responses using markdown — use bullet points, bold headers, and code blocks where appropriate.

Candidate Context:
{context}
"""


async def stream_chat_response(
    db: AsyncSession,
    user_id: str,
    message: str,
) -> AsyncGenerator[str, None]:
    """
    Stream the AI career assistant's response token-by-token.

    This async generator yields string tokens as they are produced by
    Gemini through LangChain's streaming interface. The Socket.IO
    handler emits each token immediately to the connected client.

    Args:
        db:       Async DB session (injected by Socket.IO handler).
        user_id:  UUID of the authenticated student.
        message:  The candidate's chat message.

    Yields:
        Individual text tokens (strings) as the LLM generates them.

    After exhausting:
        The full assembled response is saved to chat_sessions.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    # ── 1. Detect intent ─────────────────────────────────────────────────────
    intent = detect_intent(message)
    logger.info(
        "[Streaming] Intent=%s for user=%s message=%r", intent, user_id, message[:60]
    )

    # ── 2. Save user message immediately ─────────────────────────────────────
    await _save_chat_message(db, user_id, "user", message, intent)

    # ── 3. Fetch profile and history ─────────────────────────────────────────
    profile = await resume.get_resume_profile(db, user_id)
    history = await get_chat_history(db, user_id, limit=6)
    history_raw = await get_chat_history_raw(db, user_id, limit=6)

    context_str = "No resume uploaded yet — responses will be general."
    if profile and profile.summary:
        context_str = (
            f"Professional Summary: {profile.summary}\n"
            f"Skills: {', '.join(profile.skills or [])}"
        )

    # ── 4. Build intent-specific context ─────────────────────────────────────
    extra_context = ""
    if intent == "recommend_jobs" and profile and profile.embedding:
        try:
            matches = await find_matching_jobs(
                db=db,
                user_id=user_id,
                message=message,
                chat_history=history_raw,
                limit=5,
            )
            if matches:
                lines = [
                    f"- **{m['title']}** ({m.get('job_type', '')}, {m.get('location', '')}) "
                    f"— {int(m['similarity_score'] * 100)}% match"
                    for m in matches
                ]
                extra_context = "\n\n**Top job matches based on your profile:**\n" + "\n".join(lines)
            else:
                extra_context = "\n\nNo current job listings matched your profile."
        except Exception as exc:
            logger.warning("[Streaming] Job matching failed during chat: %s", exc)

    # ── 5. Assemble LangChain messages ───────────────────────────────────────
    system_content = _STREAMING_SYSTEM_PROMPT.format(context=context_str)
    if extra_context:
        system_content += extra_context
        system_content += "\n\nUse the data above to directly answer the candidate's question."

    lc_messages = [SystemMessage(content=system_content)]

    # Add conversation history (convert role names)
    for msg in history:
        role = msg["role"]
        content = msg["content"]
        if role in ("user",):
            lc_messages.append(HumanMessage(content=content))
        elif role in ("assistant", "model"):
            lc_messages.append(AIMessage(content=content))

    # Ensure current message is the last user turn
    if not lc_messages or not isinstance(lc_messages[-1], HumanMessage):
        lc_messages.append(HumanMessage(content=message))
    elif lc_messages[-1].content != message:
        lc_messages.append(HumanMessage(content=message))

    # ── 6. Stream tokens via LangChain ───────────────────────────────────────
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_llm_model,
        google_api_key=settings.google_api_key,
        temperature=0.4,
        streaming=True,
        max_output_tokens=2048,
    )

    full_response = ""
    try:
        async for chunk in llm.astream(lc_messages):
            token = chunk.content or ""
            if token:
                full_response += token
                yield token
    except Exception as exc:
        error_msg = f"\n\n⚠️ Streaming interrupted: {exc}"
        yield error_msg
        full_response += error_msg
        logger.error("[Streaming] LangChain stream error for user=%s: %s", user_id, exc)

    # ── 7. Persist the complete response ─────────────────────────────────────
    if full_response.strip():
        try:
            await _save_chat_message(db, user_id, "assistant", full_response, intent)
            logger.info(
                "[Streaming] Saved response (%d chars, intent=%s) for user=%s",
                len(full_response), intent, user_id
            )
        except Exception as exc:
            logger.error("[Streaming] Failed to save response to DB: %s", exc)
