"""Pydantic schemas for auth (register, login, token, user)."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request body for user registration."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="Password")
    first_name: str | None = Field(None, max_length=128, description="First name")
    last_name: str | None = Field(None, max_length=128, description="Last name")


class LoginRequest(BaseModel):
    """Request body for login."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="Password")


class TokenResponse(BaseModel):
    """Access token returned after login or register."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Current user info (no password)."""

    id: UUID
    email: str
    first_name: str | None = None
    last_name: str | None = None

    model_config = {"from_attributes": True}
