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
- Interactive lesson player with all five required exercise types
- Immediate answer feedback, persistent hearts, XP, streaks, and skill progress
- Resumable lesson attempts, completion celebration, and mocked heart refill
- Profile dashboard with progress statistics, daily goal, and achievements
- Ranked league podium and standings with current-learner highlighting
- Versioned course, lesson, profile, and leaderboard APIs
- SQLAlchemy domain model for content, progress, and lesson attempts
- Alembic migration workflow with a reversible initial schema
- SQLite foreign keys, uniqueness rules, and check constraints
- Idempotent Spanish course and learner-progress seed data

## Tech stack

| Layer | Technology | How it is used |
| --- | --- | --- |
| Monorepo | Turborepo, pnpm workspaces | Runs frontend and backend tasks from one root command with dependency-aware caching |
| Frontend | Next.js 16, React 19, TypeScript | App Router pages, protected learner flows, modular interactive UI |
| Server state | TanStack Query | Typed requests, caching, retries, invalidation, and request cancellation |
| UI | CSS Modules, Motion, Lucide | Scoped styling, animated feedback, and accessible interface icons |
| Backend | FastAPI, Python 3.12, Pydantic | Versioned JSON API, validation, authentication, and OpenAPI documentation |
| Persistence | SQLAlchemy 2, Alembic, SQLite | Relational domain model, migrations, transactions, and local persistent data |
| Authentication | Argon2id, PyJWT, HttpOnly cookies | Hashed local credentials and signed browser sessions |
| Quality | Vitest, Testing Library, pytest, mypy, Ruff, ESLint | Behaviour tests, type checks, linting, and production validation |

pnpm owns JavaScript packages and workspace orchestration. uv independently
owns the Python environment and backend builds. This preserves the native
tooling and lockfile for each ecosystem.

## Architecture overview

```text
Browser
  |
  | HttpOnly session cookie + versioned JSON
  v
Next.js frontend
  routes -> AuthGuard -> feature pages -> typed TanStack Query hooks
  shared shell + focused feature components
  |
  v
FastAPI backend
  routes -> Pydantic schemas -> services -> repositories
  |
  v
SQLAlchemy unit of work -> SQLite
```

The frontend never calculates authoritative XP, hearts, streaks, answers, or
rankings. It renders server state and manages short-lived interaction state such
as selected words. FastAPI owns evaluation and progression rules. Services
coordinate use cases, repositories isolate recurring queries, and SQLAlchemy
transactions persist a completed state change atomically.

The monorepo keeps deployable applications in `frontend/` and `backend/`.
Reusable UI lives at frontend application scope, while feature-specific code is
grouped under `frontend/src/features`. Backend routes, schemas, services,
repositories, and models have separate responsibilities.

## Database schema overview

The SQLite schema is relational rather than storing a course or attempt as one
large JSON document:

```text
Course -> Unit -> Skill -> Lesson -> Exercise
                    |                     |
                    +-> SkillPrerequisite |
                                          v
User -> SkillProgress          Attempt -> AttemptAnswer
  |         |
  +-> DailyActivity
  +-> UserAchievement -> Achievement
```

- Ordered uniqueness constraints protect unit, skill, lesson, and exercise
  positions.
- Prerequisite rows form the skill dependency graph.
- Attempts and answers preserve lesson history and resumability.
- Daily activity makes streak and daily-goal logic date-testable.
- User-owned progress rows keep hearts, XP, streaks, and completion persistent
  per learner.
- Alembic is the source-controlled schema history; model and migration drift is
  tested.

See [docs/database-schema.md](docs/database-schema.md) for table-level details
and relationship rationale.

## Assignment assumptions

- One English-to-Spanish course is enough for the requested seeded scope.
- Audio and speech recognition are optional, so exercises use text prompts.
- Gems are a persisted but mocked currency; there is no payment workflow.
- Practice refill is intentionally mocked and restores hearts immediately.
- Local authentication uses one documented demo account while still applying
  production-style password hashing and HttpOnly cookie boundaries.
- Leaderboard opponents are seeded users and ranking uses total XP.
- Quests, Shop, Settings, Search, and Guidebook are explicit placeholders.
- Responsive CSS is included, but mobile-browser QA is excluded from this
  submission run at the project owner's request.

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

# Create separate local configuration for each application.
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

cd backend
uv sync
uv run alembic upgrade head
cd ..
pnpm db:seed
```

The backend and frontend deliberately use separate environment files:

```text
backend/.env   Private database, password, JWT signing, cookie, and CORS values
frontend/.env  Browser-safe API origin and public cookie-name values only
```

Both actual `.env` files are ignored by Git. Commit only the corresponding
`.env.example` templates. Never place a signing secret, password, or database
credential in a `NEXT_PUBLIC_*` variable because Next.js exposes those values
to browser JavaScript.

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

## Deployment

Production is prepared for a Vercel Next.js frontend and a DigitalOcean Droplet
running the FastAPI container with persistent SQLite storage. Vercel proxies
same-origin `/api` requests to FastAPI, keeping the HttpOnly session cookie
first-party.

The frontend Vercel project is `ashishbaberwal/lingotrail-scaler`. The
DigitalOcean deployment uses Docker Compose, a host-mounted data directory, and
Caddy-managed HTTPS.

See [docs/deployment.md](docs/deployment.md) for environment variables, startup
order, smoke tests, persistence verification, and rollback steps.

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
POST /api/v1/lessons/{lesson_id}/attempts
POST /api/v1/attempts/{attempt_id}/answers
POST /api/v1/hearts/refill
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

The lesson route renders multiple choice, word bank, match-pair, fill-blank, and
typed-answer exercises. FastAPI evaluates every submission, while React owns
only the current draft and feedback transition. Persistent attempt, heart, XP,
streak, and progress state remains authoritative on the backend.

The Profile and Leaderboard routes reuse an application-level shell with
route-aware navigation. Typed TanStack Query hooks compose the focused profile
and ranking APIs, while modular feature components render identity, goals,
badges, the league podium, and current-learner standings.

See the [frontend learning-path guide](docs/frontend-learning-path.md) and
[ADR 004](docs/decisions/004-frontend-state-and-interaction.md) for component
responsibilities, responsive behavior, and the alternatives considered.

See the [lesson-loop guide](docs/lesson-loop.md) and
[ADR 006](docs/decisions/006-lesson-attempt-lifecycle.md) for exercise payloads,
answer privacy, transaction rules, and interview explanations.

See the [profile and leaderboard guide](docs/profile-and-leaderboard.md) for
component boundaries, query ownership, edge-case handling, and interview-ready
trade-offs.

The complete PDF-to-code audit is recorded in
[docs/assignment-compliance.md](docs/assignment-compliance.md).
