"""Request log routes: list logs for current user."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import RequestLog, User
from app.deps import get_current_user
from app.schemas.request_log import RequestLogItem

router = APIRouter(prefix="/request-logs", tags=["request-logs"])


@router.get("", response_model=list[RequestLogItem])
async def list_request_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[RequestLogItem]:
    """List request logs for the current user, newest first."""
    result = await db.execute(
        select(RequestLog)
        .where(RequestLog.user_id == current_user.id)
        .order_by(RequestLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    logs = result.scalars().all()
    return [RequestLogItem.model_validate(log) for log in logs]
