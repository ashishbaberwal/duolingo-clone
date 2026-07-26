from app.config import get_settings
from app.db.session import SessionLocal
from app.seed.service import seed_database


def main() -> None:
    settings = get_settings()
    with SessionLocal() as session:
        result = seed_database(
            session,
            demo_username=settings.default_learner_username,
            demo_password=settings.demo_learner_password,
        )

    action = "created" if result.created else "already present"
    print(
        "Seed data "
        f"{action}: {result.courses} course, {result.units} units, "
        f"{result.skills} skills, {result.lessons} lessons, "
        f"{result.exercises} exercises, {result.users} users."
    )


if __name__ == "__main__":
    main()
