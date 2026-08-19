"""
CareerPilot — Socket.IO Server (Real-Time Streaming Chat)

Implements a bi-directional WebSocket channel for the AI career assistant.
The Python FastAPI backend is wrapped in a Socket.IO ASGI application so
both HTTP REST routes and Socket.IO events are served on the same port (8000).

Socket.IO Events (Server → Client):
  chat_token  — { token: str }         emitted for each LLM response token
  chat_done   — { intent: str }        signals end of stream + detected intent
  chat_error  — { message: str }       error notification to client
  connected   — { user_id: str }       confirms authenticated connection

Socket.IO Events (Client → Server):
  chat_message — { message: str }      sends a new user message to stream

Authentication:
  JWT token must be passed in the Socket.IO handshake auth payload:
    io(url, { auth: { token: "Bearer <jwt>" } })
  The server validates the JWT on connect and stores user_id in the session.
  Any connection without a valid student JWT is rejected with a 401.
"""

import logging
from typing import Optional

import socketio

# Use AsyncSessionLocal directly — NOT get_db() which is a FastAPI generator
# that expects to be driven by Starlette's dependency injection lifecycle.
# Calling it from Socket.IO event handlers causes double-close errors.
from db.database import AsyncSessionLocal
from utils.auth import decode_token
from services.gemini_service import detect_intent
from sockets.streaming import stream_chat_response

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Socket.IO Async Server
# cors_allowed_origins is set to "*" here; restrict in production via CORS_ORIGINS env
# ---------------------------------------------------------------------------
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",  # Tightened at the ASGI wrapper level in main.py
    ping_timeout=60,
    ping_interval=25,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_jwt(auth: Optional[dict]) -> Optional[str]:
    """Extract JWT string from the Socket.IO auth payload."""
    if not auth:
        return None
    token = auth.get("token", "")
    if token.startswith("Bearer "):
        token = token[7:]
    return token or None


# ---------------------------------------------------------------------------
# Connection Lifecycle
# ---------------------------------------------------------------------------

@sio.event
async def connect(sid: str, environ: dict, auth: Optional[dict] = None):
    """
    Validate JWT on connection.
    Rejects non-student connections with a False return (triggers disconnect).
    """
    token = _extract_jwt(auth)
    if not token:
        logger.warning("[Socket.IO] Connection rejected (no token): sid=%s", sid)
        return False  # Triggers disconnect on client side

    payload = decode_token(token)
    if not payload:
        logger.warning("[Socket.IO] Connection rejected (invalid token): sid=%s", sid)
        return False

    user_id = payload.get("sub")
    role = payload.get("role")

    # Only students can use the chat assistant
    if not user_id or role != "student":
        logger.warning(
            "[Socket.IO] Connection rejected (role=%s): sid=%s", role, sid
        )
        return False

    # Store user_id in session for use in event handlers
    await sio.save_session(sid, {"user_id": user_id})
    logger.info("[Socket.IO] Client connected: sid=%s user_id=%s", sid, user_id)

    # Notify client of successful connection
    await sio.emit("connected", {"user_id": user_id, "status": "ok"}, to=sid)


@sio.event
async def disconnect(sid: str):
    """Handle client disconnection — clean up session."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id", "unknown") if session else "unknown"
    logger.info("[Socket.IO] Client disconnected: sid=%s user_id=%s", sid, user_id)


# ---------------------------------------------------------------------------
# Chat Message Handler — streams Gemini response token-by-token
# ---------------------------------------------------------------------------

@sio.event
async def chat_message(sid: str, data: dict):
    """
    Receive a chat message and stream the AI response back token-by-token.

    Client emits:  { message: "What Python jobs are available?" }
    Server emits:  chat_token events (one per token) then chat_done

    We create the DB session directly via AsyncSessionLocal (not via get_db())
    because get_db() is a FastAPI dependency generator designed to be driven by
    Starlette's request lifecycle. Using it in a Socket.IO handler causes an
    IllegalStateChangeError when the generator's finally-block tries to close
    a session that is still mid-transaction.
    """
    session = await sio.get_session(sid)
    if not session:
        await sio.emit("chat_error", {"message": "Session expired. Reconnect."}, to=sid)
        return

    user_id: str = session.get("user_id")
    message: str = data.get("message", "").strip()

    if not user_id:
        await sio.emit("chat_error", {"message": "Authentication required."}, to=sid)
        return

    if not message:
        await sio.emit("chat_error", {"message": "Message cannot be empty."}, to=sid)
        return

    logger.info(
        "[Socket.IO] chat_message: user=%s message=%r", user_id, message[:80]
    )

    # Detect intent upfront (fast — keyword matching first, then Gemini)
    intent = detect_intent(message)

    # Create a dedicated DB session for this Socket.IO event.
    # Using async context manager ensures proper cleanup even on exceptions.
    async with AsyncSessionLocal() as db:
        try:
            # Stream tokens from the LangChain generator
            async for token in stream_chat_response(db=db, user_id=user_id, message=message):
                await sio.emit("chat_token", {"token": token}, to=sid)

            await db.commit()

            # Signal end of stream to client
            await sio.emit("chat_done", {"intent": intent}, to=sid)
            logger.info(
                "[Socket.IO] Stream complete: user=%s intent=%s", user_id, intent
            )

        except Exception as exc:
            await db.rollback()
            logger.error(
                "[Socket.IO] Stream error for user=%s: %s", user_id, exc, exc_info=True
            )
            await sio.emit(
                "chat_error",
                {"message": "An error occurred while generating the response. Please try again."},
                to=sid,
            )
