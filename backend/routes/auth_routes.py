"""
CareerPilot — Authentication Routes
Handles user registration and login for both students and recruiters.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from db.database import get_db
from db import schemas, crud
from utils.auth import create_access_token, get_current_user
from db.crud import users, companies

router = APIRouter()


# ---------------------------------------------------------------------------
# Student Authentication
# ---------------------------------------------------------------------------
@router.post("/register/student", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_student(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new student/candidate."""
    try:
        new_user = await users.create_user(
            db=db,
            email=user.email,
            password=user.password,
            full_name=user.full_name,
            phone=user.phone,
        )
        return new_user
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered.",
        )


@router.post("/login/student", response_model=schemas.TokenResponse)
async def login_student(credentials: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a student and return a JWT."""
    user = await users.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user_id=str(user.id), role="student")
    return {"access_token": access_token, "role": "student"}


# ---------------------------------------------------------------------------
# Recruiter Authentication
# ---------------------------------------------------------------------------
@router.post("/register/recruiter", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
async def register_recruiter(company: schemas.CompanyCreate, db: AsyncSession = Depends(get_db)):
    """Register a new recruiter/company account."""
    try:
        new_company = await companies.create_company(
            db=db,
            email=company.email,
            password=company.password,
            company_name=company.company_name,
            website=company.website,
            industry=company.industry,
            description=company.description,
        )
        return new_company
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered.",
        )


@router.post("/login/recruiter", response_model=schemas.TokenResponse)
async def login_recruiter(credentials: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a recruiter and return a JWT."""
    company = await companies.authenticate_company(db, credentials.email, credentials.password)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user_id=str(company.id), role="recruiter")
    return {"access_token": access_token, "role": "recruiter"}


# ---------------------------------------------------------------------------
# Common
# ---------------------------------------------------------------------------
@router.get("/me")
async def get_my_profile(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the profile of the currently authenticated user/company."""
    user_id, role = current
    if role == "student":
        return await users.get_user_by_id(db, user_id)
    elif role == "recruiter":
        return await companies.get_company_by_id(db, user_id)
    raise HTTPException(status_code=400, detail="Unknown role")
