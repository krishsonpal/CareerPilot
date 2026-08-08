"""
CareerPilot — Companies CRUD
Async database operations for the companies table (recruiters).
"""

from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Company
from utils.auth import get_password_hash, verify_password


async def create_company(
    db: AsyncSession,
    email: str,
    password: str,
    company_name: str,
    website: Optional[str] = None,
    industry: Optional[str] = None,
    description: Optional[str] = None,
) -> Company:
    """
    Create and persist a new recruiter / company account.

    Args:
        db:           Async database session.
        email:        Unique company email (used as login identifier).
        password:     Plaintext password — bcrypt-hashed before storage.
        company_name: Registered company name.
        website:      Optional company website URL.
        industry:     Optional industry sector (e.g. "Technology").
        description:  Optional short company description.

    Returns:
        The newly created Company ORM instance.

    Raises:
        sqlalchemy.exc.IntegrityError: If email already exists.
    """
    company = Company(
        email=email.lower().strip(),
        password_hash=get_password_hash(password),
        company_name=company_name.strip(),
        website=website,
        industry=industry,
        description=description,
        plan="free",
        verified=False,
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


async def get_company_by_email(db: AsyncSession, email: str) -> Optional[Company]:
    """Fetch a company by email address (case-insensitive)."""
    result = await db.execute(
        select(Company).where(Company.email == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def get_company_by_id(db: AsyncSession, company_id: str) -> Optional[Company]:
    """Fetch a company by its UUID."""
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    return result.scalar_one_or_none()


async def authenticate_company(
    db: AsyncSession, email: str, password: str
) -> Optional[Company]:
    """
    Verify recruiter email + password credentials.

    Returns:
        Company if valid, None otherwise.
    """
    company = await get_company_by_email(db, email)
    if not company:
        return None
    if not verify_password(password, company.password_hash):
        return None
    return company


async def update_company_profile(
    db: AsyncSession,
    company_id: str,
    company_name: Optional[str] = None,
    website: Optional[str] = None,
    industry: Optional[str] = None,
    description: Optional[str] = None,
    logo_url: Optional[str] = None,
) -> Optional[Company]:
    """Update mutable company profile fields."""
    values = {}
    if company_name is not None:
        values["company_name"] = company_name.strip()
    if website is not None:
        values["website"] = website
    if industry is not None:
        values["industry"] = industry
    if description is not None:
        values["description"] = description
    if logo_url is not None:
        values["logo_url"] = logo_url

    if not values:
        return await get_company_by_id(db, company_id)

    await db.execute(
        update(Company).where(Company.id == company_id).values(**values)
    )
    return await get_company_by_id(db, company_id)
