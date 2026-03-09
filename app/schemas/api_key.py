"""Pydantic schemas for API keys."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    """Optional name when creating a key."""

    name: str | None = Field(None, max_length=255)


class ApiKeyCreateResponse(BaseModel):
    """Created key (plain key shown only once)."""

    id: UUID
    key: str
    key_prefix: str
    name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyListItem(BaseModel):
    """List item (no plain key)."""

    id: UUID
    key_prefix: str
    name: str | None
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
