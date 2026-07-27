import asyncio

import httpx
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.seed import seed_database


def test_health_check() -> None:
    async def request_health() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/v1/health")

    response = asyncio.run(request_health())

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "api"}


def test_readiness_requires_seeded_course(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Course content is unavailable."}


def test_readiness_confirms_database_and_course(
    api_client: TestClient,
    db_session: Session,
) -> None:
    seed_database(db_session)

    response = api_client.get("/api/v1/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "service": "api",
        "database": "ok",
    }
