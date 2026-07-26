# LingoTrail

LingoTrail is an original, Duolingo-inspired language-learning application built
for the Scaler AI full-stack internship assignment. The repository is organized
as a Turborepo monorepo with a Next.js frontend and a FastAPI backend.

## Current status

The project currently includes:

- Next.js frontend workspace
- FastAPI backend workspace
- One Turbo command for both applications
- Type checking, linting, tests, and production builds
- Responsive, API-driven learning path with interactive skill states
- Typed query boundary with loading, retry, and failure experiences
- Original LingoTrail visual system and Pip mascot
- Local login page with Argon2 password hashing and HttpOnly cookie sessions
- Protected learner pages and API endpoints with login and logout flows
- Versioned course, lesson, profile, and leaderboard APIs
- SQLAlchemy domain model for content, progress, and lesson attempts
- Alembic migration workflow with a reversible initial schema
- SQLite foreign keys, uniqueness rules, and check constraints
- Idempotent Spanish course and learner-progress seed data

## Repository structure

```text
.
├── frontend/       Next.js and TypeScript application
├── backend/        FastAPI and Python application
├── packages/       Reserved for genuinely shared workspace packages
├── docs/decisions/ Architectural decision records
├── turbo.json      Cross-workspace task definitions
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 22
- pnpm 11.10
- Python 3.12
- uv

The committed lockfiles make dependency installation reproducible.

## Setup

```bash
pnpm install
cd backend
uv sync
uv run alembic upgrade head
cd ..
pnpm db:seed
```

## Development

Start both applications from the repository root:

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs
- Health endpoint: http://localhost:8000/api/v1/health

Local sign-in:

```text
URL:      http://localhost:3000/login
Username: learner
Password: LingoTrail@123
```

The password is local demo data. SQLite stores only its Argon2id hash.

## Quality checks

Run the complete local quality gate:

```bash
pnpm check
```

Turbo runs linting, type checking, tests, and production builds for both
workspaces. Individual commands are also available:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

## Why two package managers?

pnpm owns JavaScript dependencies and workspace orchestration. uv owns the
Python environment and Python dependencies. The backend has a small
`package.json` containing command adapters only; it does not use npm packages
for its application code.

See [ADR 001](docs/decisions/001-monorepo-and-tooling.md) for the complete
decision and alternatives.

## Database workflow

The application uses SQLAlchemy models as the domain definition and Alembic
migrations as the database change history.

```bash
cd backend

# Bring a new or existing database to the latest schema.
uv run alembic upgrade head

# Check whether models and migrations have drifted apart.
uv run alembic check

# Reverse the most recent migration.
uv run alembic downgrade -1
```

The local SQLite file is generated under `backend/data/` and is intentionally
not committed. See the [database schema guide](docs/database-schema.md) and
[ADR 002](docs/decisions/002-relational-domain-model.md).

## Seed data

After applying migrations, populate the development database from the repository
root:

```bash
pnpm db:seed
```

The command is idempotent: the first run creates the catalog and sample users,
while later runs report that the seed is already present without duplicating
records. The complete dataset is described in
[docs/seed-data.md](docs/seed-data.md).

## API

The FastAPI service exposes versioned JSON endpoints under `/api/v1`:

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
GET /api/v1/path
GET /api/v1/lessons/{lesson_id}
GET /api/v1/profile
GET /api/v1/leaderboard
```

Interactive OpenAPI documentation is available at
http://localhost:8000/docs. See the [API guide](docs/api.md) and
[ADR 003](docs/decisions/003-public-api-boundary.md) for response contracts,
privacy rules, and architectural decisions.

See the [authentication guide](docs/authentication.md) and
[ADR 005](docs/decisions/005-cookie-authentication.md) for cookie properties,
token validation, local credentials, and production requirements.

## Frontend

The home page reads `/api/v1/path` through a typed TanStack Query hook and maps
the response into:

- desktop, tablet, and mobile navigation;
- streak, gem, heart, and daily-goal indicators;
- a winding unit and skill trail;
- completed, available, and locked skill controls;
- a next-lesson action and recoverable API error state.

The interface uses local state only for the currently open skill card. Server
data remains in the query cache, and a global state library will be introduced
only if the lesson-session workflow proves it is needed.

See the [frontend learning-path guide](docs/frontend-learning-path.md) and
[ADR 004](docs/decisions/004-frontend-state-and-interaction.md) for component
responsibilities, responsive behavior, and the alternatives considered.
