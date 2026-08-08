"""
CareerPilot — Resume Parser Service
Extracts text from PDF/TXT files and uses Gemini to produce
a structured resume profile with skills, education, experience, and projects.

No fallbacks. Gemini is the only AI provider.
"""

import logging
import os
import re
from typing import Dict, Any, Optional

import PyPDF2
import pdfplumber

from services.gemini_service import embed_text, extract_json

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Text Extraction — PDF / TXT
# ---------------------------------------------------------------------------
def extract_text_from_file(file_path: str) -> str:
    """
    Extract plain text from a resume file (PDF or TXT).

    Tries PyPDF2 first for speed; falls back to pdfplumber for
    scanned/complex PDFs that PyPDF2 cannot handle well.

    Args:
        file_path: Absolute path to the uploaded file.

    Returns:
        Extracted text string.

    Raises:
        ValueError: If the file type is unsupported or text cannot be extracted.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext in (".txt", ".md"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        if not text.strip():
            raise ValueError("Text file is empty.")
        return text

    if ext == ".pdf":
        text = _extract_pdf_pypdf2(file_path)
        if len(text.strip()) < 50:
            logger.info("PyPDF2 extracted too little text, trying pdfplumber")
            text = _extract_pdf_pdfplumber(file_path)

        if len(text.strip()) < 50:
            raise ValueError(
                "Could not extract readable text from the PDF. "
                "Please ensure it is not a scanned image-only PDF."
            )
        return text

    raise ValueError(
        f"Unsupported file type: '{ext}'. Please upload a PDF or TXT file."
    )


def _extract_pdf_pypdf2(path: str) -> str:
    """Extract text using PyPDF2 (fast, works for most digital PDFs)."""
    try:
        text_parts = []
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as exc:
        logger.warning("PyPDF2 failed for %s: %s", path, exc)
        return ""


def _extract_pdf_pdfplumber(path: str) -> str:
    """Extract text using pdfplumber (more robust, handles complex layouts)."""
    try:
        text_parts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as exc:
        logger.warning("pdfplumber failed for %s: %s", path, exc)
        return ""


# ---------------------------------------------------------------------------
# 2. Gemini Resume Parsing — Structured JSON Output
# ---------------------------------------------------------------------------
_RESUME_PARSE_PROMPT = """\
You are an expert resume parser. Extract structured information from the resume text below.

Return ONLY a valid JSON object with this exact structure (no explanation, no markdown):
{{
  "full_name": "Candidate's full name or empty string",
  "summary": "A 3-5 sentence professional summary of the candidate highlighting their background, key skills, and career goals",
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    {{
      "degree": "Degree name",
      "institution": "University/College name",
      "year": "Graduation year or expected year",
      "gpa": "GPA if mentioned, else null"
    }}
  ],
  "experience": [
    {{
      "title": "Job title or role",
      "company": "Company or organization name",
      "duration": "Duration e.g. Jun 2023 - Aug 2023 or 3 months",
      "description": "Key responsibilities and achievements in 2-3 bullet points"
    }}
  ],
  "projects": [
    {{
      "name": "Project name",
      "description": "What the project does in 1-2 sentences",
      "tech_stack": ["tech1", "tech2"],
      "link": "GitHub/live link if mentioned, else null"
    }}
  ]
}}

Rules:
- skills must be a flat list of strings (e.g. ["Python", "React", "SQL"])
- If a section has no data, return an empty list []
- Do not invent information not present in the resume
- Keep descriptions concise

Resume Text:
{resume_text}
"""


def parse_resume_to_profile(raw_text: str) -> Dict[str, Any]:
    """
    Use Gemini to parse raw resume text into a structured profile dict.

    Args:
        raw_text: Full extracted text from the resume file.

    Returns:
        Dict with keys: full_name, summary, skills, education, experience, projects

    Raises:
        ValueError: If Gemini returns invalid JSON.
        google.genai.errors.APIError: On Gemini API failure.
    """
    # Truncate input to stay within Gemini's context window
    truncated = raw_text[:8000]

    prompt = _RESUME_PARSE_PROMPT.format(resume_text=truncated)

    profile = extract_json(
        prompt,
        expected_keys=["summary", "skills", "education", "experience", "projects"],
    )

    # Normalise — ensure lists are always lists, not None
    profile.setdefault("full_name", "")
    profile.setdefault("summary", "")
    profile["skills"] = _normalise_skills(profile.get("skills", []))
    profile["education"] = profile.get("education") or []
    profile["experience"] = profile.get("experience") or []
    profile["projects"] = profile.get("projects") or []

    logger.info(
        "parse_resume_to_profile: extracted %d skills, %d experience entries",
        len(profile["skills"]),
        len(profile["experience"]),
    )
    return profile


def _normalise_skills(raw: Any) -> list:
    """Ensure skills is a flat list of clean strings."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(s).strip() for s in raw if s and str(s).strip()]
    if isinstance(raw, str):
        return [s.strip() for s in re.split(r"[,;/|]", raw) if s.strip()]
    return []


# ---------------------------------------------------------------------------
# 3. Resume Embedding — Gemini text-embedding-004
# ---------------------------------------------------------------------------
def embed_resume_summary(summary: str) -> list:
    """
    Generate a 768-dim embedding vector for a resume summary.

    The embedding is stored in resume_profiles.embedding (pgvector)
    and used for semantic job matching.

    Args:
        summary: The Gemini-generated professional summary from parse_resume_to_profile.

    Returns:
        List of 768 floats.
    """
    return embed_text(summary)


# ---------------------------------------------------------------------------
# 4. Full Pipeline — file → structured profile + embedding
# ---------------------------------------------------------------------------
def process_resume_file(file_path: str) -> Dict[str, Any]:
    """
    End-to-end resume processing pipeline:
      1. Extract text from PDF/TXT
      2. Parse into structured profile via Gemini
      3. Generate embedding vector via Gemini

    Args:
        file_path: Path to the uploaded resume file.

    Returns:
        Dict containing:
          - raw_text (str)
          - summary (str)
          - skills (List[str])
          - education (List[dict])
          - experience (List[dict])
          - projects (List[dict])
          - embedding (List[float]) — 768-dim vector
          - full_name (str)

    Raises:
        ValueError: On unsupported file type or empty text.
        google.genai.errors.APIError: On Gemini API failure.
    """
    # Step 1: Extract text
    raw_text = extract_text_from_file(file_path)
    logger.info("process_resume_file: extracted %d chars from %s", len(raw_text), file_path)

    # Step 2: Parse into structured profile
    profile = parse_resume_to_profile(raw_text)
    profile["raw_text"] = raw_text

    # Step 3: Generate embedding from summary
    summary = profile.get("summary", "")
    if not summary:
        summary = " ".join(profile.get("skills", []))  # fallback to skills list
    profile["embedding"] = embed_resume_summary(summary)

    return profile