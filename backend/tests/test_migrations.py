import os
import sqlite3
import subprocess
from pathlib import Path


def run_alembic(database_url: str, *arguments: str) -> subprocess.CompletedProcess[str]:
    backend_directory = Path(__file__).resolve().parents[1]
    alembic_executable = backend_directory / ".venv" / "bin" / "alembic"
    environment = {**os.environ, "DATABASE_URL": database_url}

    return subprocess.run(
        [str(alembic_executable), *arguments],
        cwd=backend_directory,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )


def test_initial_migration_is_reversible_and_matches_models(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'migration-test.db'}"

    run_alembic(database_url, "upgrade", "head")
    drift_check = run_alembic(database_url, "check")
    run_alembic(database_url, "downgrade", "base")
    run_alembic(database_url, "upgrade", "head")

    assert "No new upgrade operations detected" in drift_check.stdout


def test_password_migration_preserves_existing_users(tmp_path: Path) -> None:
    database_path = tmp_path / "populated-migration-test.db"
    database_url = f"sqlite:///{database_path}"
    run_alembic(database_url, "upgrade", "2bca21859cef")

    with sqlite3.connect(database_path) as connection:
        connection.execute(
            """
            INSERT INTO users (
                username, display_name, avatar_key, timezone, hearts,
                max_hearts, gems, total_xp, current_streak, longest_streak,
                daily_goal_xp, created_at, updated_at
            ) VALUES (
                'learner', 'Ava', 'fox', 'UTC', 5,
                5, 500, 0, 0, 0,
                20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            """
        )

    run_alembic(database_url, "upgrade", "head")

    with sqlite3.connect(database_path) as connection:
        row = connection.execute(
            "SELECT username, password_hash FROM users"
        ).fetchone()

    assert row == ("learner", "!")
