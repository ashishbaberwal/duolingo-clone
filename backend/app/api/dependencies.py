from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db.session import get_session
from app.models import User
from app.repositories.auth import get_user_by_id
from app.services.auth import decode_session_token

SessionDependency = Annotated[Session, Depends(get_session)]
SettingsDependency = Annotated[Settings, Depends(get_settings)]


def get_current_learner(
    request: Request,
    session: SessionDependency,
    settings: SettingsDependency,
) -> User:
    token = request.cookies.get(settings.auth_cookie_name)
    user_id = decode_session_token(token, settings) if token is not None else None
    learner = get_user_by_id(session, user_id) if user_id is not None else None
    if learner is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return learner


LearnerDependency = Annotated[User, Depends(get_current_learner)]
