from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.engine import create_db_engine, ensure_sqlite_directory

settings = get_settings()
ensure_sqlite_directory(settings.database_url)
engine = create_db_engine(settings.database_url, echo=settings.database_echo)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session() -> Generator[Session]:
    with SessionLocal() as session:
        yield session
