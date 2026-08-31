"""
CareerPilot — Cloudinary Upload Utility

Uploads resume files (PDF/TXT) to Cloudinary so the Node.js BullMQ worker
can download them via HTTPS URL instead of reading from a shared disk.

This is required on Render because the FastAPI Web Service and the Node.js
Background Worker run on separate machines and cannot share a volume.

Usage:
    from utils.cloudinary_upload import upload_resume_to_cloudinary

    url = await upload_resume_to_cloudinary(content_bytes, user_id, filename)
    # url → "https://res.cloudinary.com/.../careerpilot/resumes/user123_resume.pdf"
    # url → None if Cloudinary is not configured (local dev fallback)
"""

import asyncio
import logging
from typing import Optional

import cloudinary
import cloudinary.uploader

from utils.config import settings

logger = logging.getLogger(__name__)


def _configure_cloudinary() -> None:
    """Configure the Cloudinary SDK with credentials from settings (idempotent)."""
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def upload_resume_to_cloudinary(
    content: bytes,
    user_id: str,
    filename: str,
) -> Optional[str]:
    """
    Upload resume file bytes to Cloudinary and return the secure HTTPS URL.

    Args:
        content:  Raw file bytes (PDF or TXT).
        user_id:  Student UUID — used to create a unique public_id.
        filename: Original filename (e.g. "my_resume.pdf").

    Returns:
        Secure Cloudinary URL string if upload succeeds.
        None if Cloudinary is not configured (local dev — caller uses local path).

    Raises:
        RuntimeError: If Cloudinary is configured but upload fails.
    """
    if not settings.cloudinary_enabled:
        logger.debug(
            "Cloudinary not configured — skipping upload for user=%s. "
            "Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET for production.",
            user_id,
        )
        return None

    _configure_cloudinary()

    # Build a deterministic public_id so re-uploads overwrite the old file
    safe_name = filename.replace(" ", "_")
    public_id = f"careerpilot/resumes/{user_id}_{safe_name}"

    # Run the blocking Cloudinary SDK call in a thread pool
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.upload(
                content,
                public_id=public_id,
                resource_type="auto",  # auto detects PDF/TXT
                type="upload",
                access_mode="public",  # Ensure public CDN delivery
                overwrite=True,
                invalidate=True,       # Bust CDN cache on re-upload
            ),
        )
        url: str = result["secure_url"]
        logger.info(
            "Cloudinary upload success — user=%s public_id=%s url=%s",
            user_id,
            public_id,
            url,
        )
        return url

    except Exception as exc:
        logger.error("Cloudinary upload failed for user=%s: %s", user_id, exc)
        raise RuntimeError(f"Failed to upload resume to Cloudinary: {exc}") from exc
