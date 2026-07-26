from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.db.engine import create_db_engine
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
