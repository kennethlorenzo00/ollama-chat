"""API key routes: create, list, revoke."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import ApiKey, User
from app.deps import get_current_user
from app.schemas.api_key import (
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyListItem,
)
from app.services.api_key_service import create_api_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/keys", tags=["api-keys"])


@router.post("", response_model=ApiKeyCreateResponse)
async def create_key(
    body: ApiKeyCreateRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreateResponse:
    """Create a new API key. The plain key is returned only in this response."""
    name = body.name if body else None
    api_key = await create_api_key(db, current_user, name=name)
    plain = getattr(api_key, "plain_key", None)
    if not plain:
        raise HTTPException(status_code=500, detail="Key generation failed")
    return ApiKeyCreateResponse(
        id=api_key.id,
        key=plain,
        key_prefix=api_key.key_prefix,
        name=api_key.name,
        created_at=api_key.created_at,
    )


@router.get("", response_model=list[ApiKeyListItem])
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApiKeyListItem]:
    """List API keys for the current user (prefix and metadata only)."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [ApiKeyListItem.model_validate(k) for k in keys]


@router.delete("/{key_id}")
async def revoke_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke (delete) an API key. Only the owner can revoke."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.delete(api_key)
    await db.flush()
