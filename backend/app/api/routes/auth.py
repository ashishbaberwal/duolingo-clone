from fastapi import APIRouter, HTTPException, Response, status

from app.api.dependencies import (
    LearnerDependency,
    SessionDependency,
    SettingsDependency,
)
from app.schemas.auth import (
    AuthenticatedUserResponse,
    LoginRequest,
    LogoutResponse,
)
from app.services.auth import (
    authenticate_user,
    create_session_token,
    to_authenticated_user,
)

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=AuthenticatedUserResponse)
def login(
    credentials: LoginRequest,
    response: Response,
    session: SessionDependency,
    settings: SettingsDependency,
) -> AuthenticatedUserResponse:
    user = authenticate_user(
        session,
        credentials.username,
        credentials.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_session_token(user, settings)
    is_production = settings.app_env.casefold() == "production"
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_token_expire_minutes * 60,
        path="/",
        secure=is_production,
        httponly=True,
        samesite="lax",
    )
    return to_authenticated_user(user)


@router.get("/me", response_model=AuthenticatedUserResponse)
def current_user(learner: LearnerDependency) -> AuthenticatedUserResponse:
    return to_authenticated_user(learner)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    response: Response,
    settings: SettingsDependency,
) -> LogoutResponse:
    is_production = settings.app_env.casefold() == "production"
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        secure=is_production,
        httponly=True,
        samesite="lax",
    )
    return LogoutResponse(message="Signed out successfully.")
