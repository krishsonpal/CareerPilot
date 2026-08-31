"""
CareerPilot — Authentication Utilities
- Password hashing via bcrypt (passlib)
- JWT token creation and verification
- FastAPI dependency: get_current_user, require_student, require_recruiter
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from utils.config import settings


# ---------------------------------------------------------------------------
# Password Hashing (Direct bcrypt with 72-byte safety limit)
# ---------------------------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Return bcrypt hash of the given password."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


# ---------------------------------------------------------------------------
# JWT Token Management
# ---------------------------------------------------------------------------
bearer_scheme = HTTPBearer()


def create_access_token(user_id: str, role: str) -> str:
    """
    Create a signed JWT access token.

    Args:
        user_id: UUID string of the authenticated user/company.
        role:    "student" or "recruiter"

    Returns:
        Encoded JWT string.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.

    Returns:
        Decoded payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# FastAPI Dependencies
# ---------------------------------------------------------------------------
_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Tuple[str, str]:
    """
    FastAPI dependency: extracts and validates the Bearer token.

    Returns:
        (user_id: str, role: str) — both are strings from JWT payload.

    Raises:
        HTTP 401 if token is missing, expired, or invalid.
    """
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise _credentials_exception

    user_id: Optional[str] = payload.get("sub")
    role: Optional[str] = payload.get("role")

    if not user_id or not role:
        raise _credentials_exception

    return user_id, role


def require_student(
    current: Tuple[str, str] = Depends(get_current_user),
) -> str:
    """
    FastAPI dependency: requires the current user to have role='student'.

    Returns:
        user_id (str)

    Raises:
        HTTP 403 if the authenticated user is not a student.
    """
    user_id, role = current
    if role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to students only",
        )
    return user_id


def require_recruiter(
    current: Tuple[str, str] = Depends(get_current_user),
) -> str:
    """
    FastAPI dependency: requires the current user to have role='recruiter'.

    Returns:
        user_id (str) — this is the company UUID

    Raises:
        HTTP 403 if the authenticated user is not a recruiter.
    """
    user_id, role = current
    if role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to recruiters only",
        )
    return user_id