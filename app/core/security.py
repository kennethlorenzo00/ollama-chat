"""Password hashing, JWT, and API key hashing utilities."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

def hash_api_key(plain: str) -> str:
    """Return SHA-256 hex digest of the API key (constant-time compare)."""
    return hashlib.sha256(plain.encode()).hexdigest()


def verify_api_key(plain: str, stored_hash: str) -> bool:
    """Return True if plain key hashes to stored_hash."""
    return hash_api_key(plain) == stored_hash

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


BCRYPT_MAX_BYTES = 72


def _password_bytes(password: str) -> bytes:
    """Bcrypt accepts at most 72 bytes; return UTF-8 bytes truncated to that."""
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Return bcrypt hash of password."""
    truncated = password.encode("utf-8")[:BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")
    return pwd_context.hash(truncated)

def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain password matches hash."""
    truncated = plain.encode("utf-8")[:BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")
    return pwd_context.verify(truncated, hashed)


def create_access_token(subject: str | uuid.UUID) -> str:
    """Create a JWT access token with subject (user id)."""
    if isinstance(subject, uuid.UUID):
        subject = str(subject)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Decode JWT and return subject (user id) or None if invalid."""
    if not token or not settings.SECRET_KEY:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
