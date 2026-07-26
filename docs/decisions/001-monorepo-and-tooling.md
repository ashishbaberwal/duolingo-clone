# ADR 001: Monorepo and foundation tooling

- Status: Accepted
- Date: 2026-07-26

## Context

The assignment requires a Next.js TypeScript frontend, a Python backend, SQLite,
and top-level `frontend/` and `backend/` directories. Evaluators must be able to
run the application easily and inspect a clear separation of concerns.

## Decision

Use Turborepo and pnpm workspaces at the repository root. Keep the two required
applications in `frontend/` and `backend/`.

- pnpm manages JavaScript packages and invokes Turbo.
- uv manages the backend virtual environment and Python packages.
- `turbo.json` defines shared task names: `dev`, `lint`, `check-types`, `test`,
  and `build`.
- The backend has a private `package.json` that maps those task names to uv
  commands. It is a task adapter, not a second backend dependency system.
- Node.js is pinned to major version 22 and Python to version 3.12.

## Why this approach

Turbo gives contributors one root command while allowing each application to
keep its native tooling. It can execute independent frontend and backend tasks
in parallel and cache deterministic build outputs.

Keeping pnpm and uv responsibilities separate avoids mixing language ecosystems:

- `pnpm-lock.yaml` locks JavaScript packages.
- `backend/uv.lock` locks Python packages.
- `frontend/package.json` describes the browser application.
- `backend/pyproject.toml` describes the Python application.

## Alternatives considered

### Separate repositories

Rejected because setup and submission become harder, shared changes require
coordination across repositories, and the assignment asks for one repository
containing both directories.

### npm or pnpm scripts without Turbo

This would work initially, but it would provide no task graph or build cache.
Turbo adds these capabilities without changing the frontend or backend runtime.

### Docker Compose as the primary local workflow

Rejected for the initial assignment because SQLite needs no database container,
and containers would add setup time and concepts without solving a current
problem. Docker can be added later if deployment requires it.

### One package manager for both languages

Rejected because pnpm cannot manage Python packages and uv should not manage
JavaScript packages. The backend adapter exposes commands to Turbo while uv
remains the source of truth.

## Consequences

- Contributors run both development servers with `pnpm dev`.
- A failure in either workspace causes the root quality gate to fail.
- Turbo cache keys include source files, relevant configuration, and lockfiles.
- Python commands require uv, while frontend commands require pnpm.
- Cross-language API types will need an explicit OpenAPI generation step later.
