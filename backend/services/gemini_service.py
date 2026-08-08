"""
CareerPilot — Gemini AI Service
Central wrapper for ALL Google Gemini API calls.

Provider: Google Gemini ONLY (google-genai SDK v2.x)
- LLM:        gemini-2.0-flash
- Embeddings: text-embedding-004  (768-dim)

NO FALLBACKS. If Gemini fails, raise the exception.
"""

import json
import logging
from typing import Any, Dict, List, Optional

import google.genai as genai
from google.genai import types as genai_types

from utils.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Client Initialisation — singleton, initialised once at module load
# ---------------------------------------------------------------------------
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    """Return a cached Gemini client, initialising on first call."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
        logger.info("Gemini client initialised (model=%s)", settings.gemini_llm_model)
    return _client


# ---------------------------------------------------------------------------
# 1. Text Embedding  →  768-dim vector
# ---------------------------------------------------------------------------
def embed_text(text: str) -> List[float]:
    """
    Embed a single text string using Gemini text-embedding-004.

    Args:
        text: Input text to embed (resume summary, job description, query, etc.)

    Returns:
        List of 768 floats representing the semantic vector.

    Raises:
        google.genai.errors.APIError: on Gemini API failure (no fallback).
    """
    client = _get_client()
    response = client.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=text,
    )
    vector: List[float] = response.embeddings[0].values
    logger.debug("embed_text: produced vector dim=%d", len(vector))
    return vector


def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple texts in a single API call (batch mode).

    Useful for seeding job descriptions into the database.

    Args:
        texts: List of strings to embed.

    Returns:
        List of 768-dim float vectors, one per input text.
    """
    if not texts:
        return []

    client = _get_client()
    response = client.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=texts,
    )
    vectors = [emb.values for emb in response.embeddings]
    logger.debug("embed_batch: embedded %d texts", len(vectors))
    return vectors


# ---------------------------------------------------------------------------
# 2. Chat Completion  →  plain text response
# ---------------------------------------------------------------------------
def chat_complete(
    messages: List[Dict[str, str]],
    system_prompt: str = "",
    temperature: float = 0.3,
) -> str:
    """
    Generate a chat completion using Gemini 2.0-flash.

    Args:
        messages: Conversation history as list of dicts:
                  [{"role": "user"|"model", "content": "..."}]
        system_prompt: Optional system instruction prepended to the conversation.
        temperature: Sampling temperature (0.0 = deterministic, 1.0 = creative).

    Returns:
        The assistant's response text.

    Raises:
        google.genai.errors.APIError: on Gemini API failure.
    """
    client = _get_client()

    # Convert our message format to genai Content objects
    contents: List[genai_types.Content] = []

    if system_prompt:
        contents.append(
            genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=f"[SYSTEM]\n{system_prompt}\n[/SYSTEM]")],
            )
        )
        contents.append(
            genai_types.Content(
                role="model",
                parts=[genai_types.Part(text="Understood. I will follow those instructions.")],
            )
        )

    for msg in messages:
        role = msg.get("role", "user")
        # Gemini uses "model" not "assistant"
        if role == "assistant":
            role = "model"
        contents.append(
            genai_types.Content(
                role=role,
                parts=[genai_types.Part(text=msg.get("content", ""))],
            )
        )

    config = genai_types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=2048,
    )

    response = client.models.generate_content(
        model=settings.gemini_llm_model,
        contents=contents,
        config=config,
    )

    text = response.text or ""
    logger.debug("chat_complete: response length=%d chars", len(text))
    return text.strip()


# ---------------------------------------------------------------------------
# 3. Structured JSON Extraction  →  parsed dict
# ---------------------------------------------------------------------------
def extract_json(
    prompt: str,
    expected_keys: Optional[List[str]] = None,
    temperature: float = 0.1,
) -> Dict[str, Any]:
    """
    Ask Gemini to return structured JSON and parse it.

    Uses low temperature (0.1) for deterministic structured output.

    Args:
        prompt:        Full prompt instructing Gemini to respond in JSON.
        expected_keys: Optional list of keys to validate in the response.
        temperature:   Sampling temperature for structured tasks.

    Returns:
        Parsed JSON dict.

    Raises:
        ValueError: If the response cannot be parsed as JSON.
        google.genai.errors.APIError: on Gemini API failure.
    """
    client = _get_client()

    config = genai_types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=4096,
        response_mime_type="application/json",  # JSON mode
    )

    response = client.models.generate_content(
        model=settings.gemini_llm_model,
        contents=prompt,
        config=config,
    )

    raw = (response.text or "").strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("extract_json: failed to parse response:\n%s", raw[:500])
        raise ValueError(f"Gemini did not return valid JSON: {exc}") from exc

    # Validate expected keys if provided
    if expected_keys:
        missing = [k for k in expected_keys if k not in data]
        if missing:
            logger.warning("extract_json: missing keys %s in response", missing)

    return data


# ---------------------------------------------------------------------------
# 4. Intent Detection  →  classify user query
# ---------------------------------------------------------------------------
_INTENT_PROMPT = """\
Classify the user's message into EXACTLY ONE of these intent labels:
- recommend_jobs        → asking for job/internship recommendations or opportunities
- suggest_skills        → asking what skills to learn, improve, or develop
- market_insight        → asking about job market trends, salaries, or industry demand
- general               → greetings, general career advice, or anything else

Rules:
- Respond with ONLY the label, nothing else.
- Do not add punctuation or explanation.

User message: {query}
"""


def detect_intent(query: str) -> str:
    """
    Classify the intent of a user chat message.

    Returns one of: 'recommend_jobs', 'suggest_skills', 'market_insight', 'general'

    Uses keyword pre-screening first (fast, no API call) then falls back
    to Gemini classification for ambiguous queries.
    """
    q = query.lower()

    # Fast keyword screening (covers most cases without an API call)
    job_keywords = {"job", "internship", "intern", "role", "position", "opportunity", "hiring", "apply", "work", "placement", "career", "company"}
    skill_keywords = {"skill", "learn", "study", "course", "improve", "develop", "practice", "master", "training", "certification"}
    market_keywords = {"market", "trend", "salary", "demand", "industry", "growth", "future", "scope", "popular", "hot skills"}

    words = set(q.split())
    if words & job_keywords:
        return "recommend_jobs"
    if words & skill_keywords:
        return "suggest_skills"
    if words & market_keywords:
        return "market_insight"

    # Ambiguous — use Gemini to classify
    try:
        prompt = _INTENT_PROMPT.format(query=query)
        client = _get_client()
        config = genai_types.GenerateContentConfig(temperature=0.0, max_output_tokens=20)
        response = client.models.generate_content(
            model=settings.gemini_llm_model,
            contents=prompt,
            config=config,
        )
        label = (response.text or "general").strip().lower()
        valid = {"recommend_jobs", "suggest_skills", "market_insight", "general"}
        return label if label in valid else "general"
    except Exception as exc:
        logger.warning("detect_intent: Gemini classification failed (%s), defaulting to general", exc)
        return "general"


# ---------------------------------------------------------------------------
# 5. Skill Market Analysis  →  structured market insights
# ---------------------------------------------------------------------------
_MARKET_ANALYSIS_PROMPT = """\
You are a technical job market analyst. Based on the job market data and the candidate's query, provide actionable skill recommendations.

Candidate's current skills: {user_skills}

Most in-demand skills in the current job market (by frequency in job postings):
{market_demand_data}

Candidate's question: {user_query}

Respond with ONLY a JSON object with this exact structure:
{{
  "trending_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "priority_for_candidate": ["skill1", "skill2", "skill3"],
  "market_insights": "2-3 sentences about current market trends relevant to this candidate",
  "learning_roadmap": [
    {{"skill": "skill_name", "reason": "why this skill", "resources": "where to learn"}}
  ]
}}
"""


def analyze_skill_market(
    user_skills: List[str],
    market_demand_data: str,
    user_query: str,
) -> Dict[str, Any]:
    """
    Generate personalised skill recommendations based on market demand.

    Args:
        user_skills:         Skills extracted from the candidate's resume.
        market_demand_data:  Formatted string of skill demand scores from DB.
        user_query:          The candidate's question about skills/market.

    Returns:
        Dict with keys: trending_skills, priority_for_candidate,
                        market_insights, learning_roadmap
    """
    prompt = _MARKET_ANALYSIS_PROMPT.format(
        user_skills=", ".join(user_skills) if user_skills else "Not specified",
        market_demand_data=market_demand_data[:2000],  # Truncate to stay within context
        user_query=user_query,
    )
    return extract_json(
        prompt,
        expected_keys=["trending_skills", "priority_for_candidate", "market_insights", "learning_roadmap"],
    )
