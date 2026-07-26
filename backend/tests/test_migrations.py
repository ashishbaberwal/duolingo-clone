import os
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
