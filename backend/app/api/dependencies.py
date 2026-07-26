from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db.session import get_session
from app.models import User

SessionDependency = Annotated[Session, Depends(get_session)]
SettingsDependency = Annotated[Settings, Depends(get_settings)]


def get_default_learner(
    session: SessionDependency,
    settings: SettingsDependency,
) -> User:
    learner = session.scalar(
        select(User).where(User.username == settings.default_learner_username)
    )
    if learner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Default learner is unavailable. Run the database seed command.",
        )

    return learner


LearnerDependency = Annotated[User, Depends(get_default_learner)]
