"""Pydantic schemas for conversations and messages."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    """Single message in a conversation."""

    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationListItem(BaseModel):
    """Conversation summary for list (no messages)."""

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationListItem):
    """Full conversation with messages."""

    messages: list[MessageItem] = Field(default_factory=list)


class ConversationCreate(BaseModel):
    """Payload to create a conversation."""

    title: str = "New chat"
    messages: list[dict] = Field(default_factory=list, description="[{ role, content }]")


class ConversationUpdate(BaseModel):
    """Payload to update a conversation (title and/or messages)."""

    title: str | None = None
    messages: list[dict] | None = None  # [{ role, content }]
