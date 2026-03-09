"""Auth routes: register, login, me."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user. Returns access token."""
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        first_name=(body.first_name or "").strip() or None,
        last_name=(body.last_name or "").strip() or None,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    token = create_access_token(user.id)
    logger.info("User registered: %s", user.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login with email and password. Returns access token."""
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return current user (requires JWT)."""
    return UserResponse.model_validate(current_user)
