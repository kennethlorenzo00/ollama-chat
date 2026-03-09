"""Pydantic schemas for request logs."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RequestLogItem(BaseModel):
    """Single request log entry (for list)."""

    id: UUID
    path: str
    method: str
    status_code: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
