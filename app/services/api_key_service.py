"""API key creation and hashing."""

import secrets
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_api_key
from app.db.models import ApiKey, User

KEY_PREFIX_LEN = 16
KEY_SECRET_BYTES = 32
KEY_PREFIX = "ollama_"


def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a new API key and return (plain_key, key_prefix, key_hash).
    Plain key format: ollama_<urlsafe_token>.
    """
    plain = KEY_PREFIX + secrets.token_urlsafe(KEY_SECRET_BYTES)
    prefix = plain[:KEY_PREFIX_LEN]
    key_hash = hash_api_key(plain)
    return plain, prefix, key_hash


async def create_api_key(
    db: AsyncSession,
    user: User,
    name: str | None = None,
) -> ApiKey:
    """Create and persist an API key for the user. Caller must return plain key to client once."""
    plain, prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        user_id=user.id,
        key_prefix=prefix,
        key_hash=key_hash,
        name=name,
    )
    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)
    # Attach plain key for the response (not persisted)
    api_key.plain_key = plain  # type: ignore[attr-defined]
    return api_key
