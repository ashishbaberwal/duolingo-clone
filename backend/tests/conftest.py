from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.db.engine import create_db_engine
from app.db.session import get_session
from app.main import app
from app.models import Base


@pytest.fixture
def db_engine(tmp_path: Path) -> Generator[Engine]:
    database_path = tmp_path / "test.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)

    yield engine

    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine: Engine) -> Generator[Session]:
    with Session(db_engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def api_client(db_session: Session) -> Generator[TestClient]:
    def override_session() -> Generator[Session]:
        yield db_session

    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
