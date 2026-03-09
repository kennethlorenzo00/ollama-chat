"""Conversation routes: CRUD for user conversations and messages."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Conversation, Message, User
from app.deps import get_current_user
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetail,
    ConversationListItem,
    ConversationUpdate,
    MessageItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _conversation_to_detail(conv: Conversation) -> ConversationDetail:
    """Build ConversationDetail from ORM with messages."""
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[
            MessageItem(id=m.id, role=m.role, content=m.content, created_at=m.created_at)
            for m in conv.messages
        ],
    )


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationListItem]:
    """List conversations for the current user, newest first."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    try:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == current_user.id)
            .order_by(Conversation.updated_at.desc())
        )
        convs = result.scalars().all()
        return [ConversationListItem.model_validate(c) for c in convs]
    except Exception as e:
        logger.exception("list_conversations failed: %s", e)
        raise


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: UUID,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Get a single conversation with messages. Must belong to current user."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _conversation_to_detail(conv)


@router.post("", response_model=ConversationDetail, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Create a new conversation (optionally with initial messages)."""
    try:
        now = datetime.now(timezone.utc)
        conv = Conversation(
            user_id=current_user.id,
            title=body.title or "New chat",
            created_at=now,
            updated_at=now,
        )
        db.add(conv)
        await db.flush()
        for m in body.messages or []:
            role = (m.get("role") or "user").strip() or "user"
            content = (m.get("content") or "").strip()
            msg = Message(
                conversation_id=conv.id,
                role=role,
                content=content,
            )
            db.add(msg)
        await db.commit()
        # Re-load with messages (async sessions don't lazy-load; refresh doesn't load relationships)
        result = await db.execute(
            select(Conversation)
            .where(Conversation.id == conv.id)
            .options(selectinload(Conversation.messages))
        )
        conv = result.scalar_one()
        return _conversation_to_detail(conv)
    except Exception as e:
        logger.exception("create_conversation failed: %s", e)
        raise


@router.patch("/{conversation_id}", response_model=ConversationDetail)
async def update_conversation(
    conversation_id: UUID,
    body: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Update conversation title and/or replace messages."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if body.title is not None:
        conv.title = body.title
    conv.updated_at = datetime.now(timezone.utc)
    if body.messages is not None:
        await db.execute(delete(Message).where(Message.conversation_id == conv.id))
        for m in body.messages:
            role = (m.get("role") or "user").strip() or "user"
            content = (m.get("content") or "").strip()
            msg = Message(conversation_id=conv.id, role=role, content=content)
            db.add(msg)
    await db.commit()
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one()
    return _conversation_to_detail(conv)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a conversation and its messages."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
