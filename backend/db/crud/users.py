"""
CareerPilot — Users CRUD
Async database operations for the users table (students/candidates).
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User
from utils.auth import get_password_hash, verify_password


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    phone: Optional[str] = None,
) -> User:
    """
    Create and persist a new student user.

    Args:
        db:        Async database session.
        email:     Unique email address (used as login identifier).
        password:  Plaintext password — will be bcrypt-hashed.
        full_name: Candidate's full name.
        phone:     Optional phone number.

    Returns:
        The newly created User ORM instance.

    Raises:
        sqlalchemy.exc.IntegrityError: If email is already registered.
    """
    user = User(
        email=email.lower().strip(),
        password_hash=get_password_hash(password),
        full_name=full_name.strip(),
        phone=phone,
        plan="free",
    )
    db.add(user)
    await db.flush()  # assigns UUID id without committing (commit handled by get_db)
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Fetch a user by email address (case-insensitive)."""
    result = await db.execute(
        select(User).where(User.email == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Fetch a user by their UUID."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    """
    Verify email + password credentials.

    Returns:
        User if credentials are valid, None otherwise.
    """
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def update_user_profile(
    db: AsyncSession,
    user_id: str,
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> Optional[User]:
    """
    Update mutable user profile fields.

    Returns:
        Updated User instance, or None if not found.
    """
    values = {}
    if full_name is not None:
        values["full_name"] = full_name.strip()
    if phone is not None:
        values["phone"] = phone
    if avatar_url is not None:
        values["avatar_url"] = avatar_url

    if not values:
        return await get_user_by_id(db, user_id)

    await db.execute(
        update(User).where(User.id == user_id).values(**values)
    )
    return await get_user_by_id(db, user_id)
