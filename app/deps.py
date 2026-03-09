"""FastAPI dependencies: auth (JWT, API key), DB session."""

import logging
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db import get_db
from app.db.models import ApiKey, User

logger = logging.getLogger(__name__)


@dataclass
class AuthContext:
    """Result of validating API key or JWT for proxy/logging."""

    user_id: UUID
    api_key_id: UUID | None  # None when auth was JWT


async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Require JWT in Authorization: Bearer <token>. Load and return User or 401.
    """
    token: str | None = None
    if authorization and authorization.strip().lower().startswith("bearer "):
        token = authorization.strip()[7:].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = decode_access_token(token)
    if not sub:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = UUID(sub)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def require_api_key_or_jwt(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    """
    Validate either (1) JWT in Authorization Bearer or (2) API key in X-API-Key / Bearer.
    Return AuthContext for request logging. Raises 401 if invalid.
    """
    if not settings.SECRET_KEY:
        logger.warning("SECRET_KEY not configured; auth will fail")
        raise HTTPException(status_code=503, detail="Auth not configured")

    # Prefer API key header, then Bearer (could be JWT or raw API key)
    key_candidate: str | None = None
    if x_api_key and x_api_key.strip():
        key_candidate = x_api_key.strip()
    elif authorization and authorization.strip().lower().startswith("bearer "):
        key_candidate = authorization.strip()[7:].strip()

    if not key_candidate:
        raise HTTPException(
            status_code=401,
            detail="Missing API key or token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1) Try JWT first (Bearer with a dot is likely JWT)
    if "." in key_candidate:
        sub = decode_access_token(key_candidate)
        if sub:
            try:
                user_uuid = UUID(sub)
            except ValueError:
                pass
            else:
                result = await db.execute(select(User).where(User.id == user_uuid))
                user = result.scalar_one_or_none()
                if user:
                    return AuthContext(user_id=user.id, api_key_id=None)
            # Not a valid JWT or user missing — fall through to API key lookup
    # 2) Treat as API key: prefix for lookup, then verify hash
    from datetime import datetime, timezone

    from app.core.security import verify_api_key
    from app.services.api_key_service import KEY_PREFIX_LEN

    prefix = key_candidate[:KEY_PREFIX_LEN] if len(key_candidate) >= KEY_PREFIX_LEN else key_candidate
    result = await db.execute(select(ApiKey).where(ApiKey.key_prefix == prefix))
    rows = result.scalars().all()
    api_key_row = None
    for row in rows:
        if verify_api_key(key_candidate, row.key_hash):
            api_key_row = row
            break
    if not api_key_row:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    api_key_row.last_used_at = datetime.now(timezone.utc)
    await db.flush()

    return AuthContext(user_id=api_key_row.user_id, api_key_id=api_key_row.id)
