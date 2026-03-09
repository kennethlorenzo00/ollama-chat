"""FastAPI dependencies for API key validation."""

import logging

from fastapi import Header, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


async def require_api_key(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    """
    Validate API key from Authorization Bearer or X-API-Key header.
    Raises 401 if no valid key is configured or if the provided key is invalid.
    """
    valid = settings.valid_api_keys
    if not valid:
        logger.warning("No API_KEYS or API_KEY configured; all requests will be rejected")
        raise HTTPException(status_code=503, detail="API keys not configured")

    key: str | None = None
    if x_api_key and x_api_key.strip():
        key = x_api_key.strip()
    elif authorization and authorization.strip().lower().startswith("bearer "):
        key = authorization.strip()[7:].strip()

    if not key or key not in valid:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
