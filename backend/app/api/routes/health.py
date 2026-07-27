from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.dependencies import SessionDependency
from app.models import Course

router = APIRouter()


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str


class ReadinessResponse(BaseModel):
    status: Literal["ready"]
    service: str
    database: Literal["ok"]


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="api")


@router.get("/ready", response_model=ReadinessResponse)
def readiness_check(session: SessionDependency) -> ReadinessResponse:
    active_course_id = session.scalar(
        select(Course.id).where(Course.is_active.is_(True)).limit(1)
    )
    if active_course_id is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Course content is unavailable.",
        )

    return ReadinessResponse(status="ready", service="api", database="ok")
