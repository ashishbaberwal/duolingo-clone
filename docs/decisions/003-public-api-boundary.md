# ADR 003: Public API boundary

- Status: Accepted
- Date: 2026-07-26
- Authentication note: ADR 005 replaces the temporary default-learner
  resolution described here; the API layering and response-boundary decisions
  remain active.

## Context

The Next.js frontend needs course, lesson, profile, and leaderboard data.
Database entities include private correctness fields, internal relationships,
and implementation details that must not be exposed directly.

The assignment permits a default logged-in learner, while expecting sensible
backend and API architecture.

## Decision

Use four layers:

1. FastAPI routes for HTTP parsing and error status.
2. Dependencies for database sessions and learner resolution.
3. Services for state calculation and response construction.
4. Repositories for reusable SQLAlchemy loading queries.

Return explicit Pydantic response models rather than ORM entities.

Use `/api/v1` as a stable version prefix. At this checkpoint, resolve the
configured default learner through one dependency so real authentication can
replace it later.

## Why response schemas are separate from ORM models

ORM models describe persistence and relationships. API schemas describe the
public contract. Returning ORM objects directly risks exposing new database
fields when models evolve.

Separate schemas let the lesson contract exclude answers, correctness flags,
pairing keys, and internal explanation data by construction.

## Why answer data stays on the backend

Client-side hiding does not prevent cheating. A learner can inspect browser
network traffic or application state. The lesson read endpoint therefore sends
only renderable prompts and options.

Future answer submissions will send the learner's selection to FastAPI. The
backend will load the private canonical answer, normalize the submission,
evaluate correctness, update the attempt, and return feedback.

## Why path state is calculated in a service

`locked` and `available` are not universal properties of a skill; they depend
on one learner's progress and the skill prerequisite graph.

Persisting only a universal `skills.locked` flag would be incorrect. The service
combines course structure, user progress, completed attempts, and prerequisites
to construct learner-specific states.

## Why routes do not contain SQL queries

Embedding SQL and progression logic in route functions would tightly couple
HTTP delivery to business behaviour. Service functions can be reused by future
commands or jobs and tested without a running network server.

Repositories prevent eager-loading details from leaking throughout services
and avoid accidental N+1 query patterns on the nested learning path.

## Alternatives considered

### Return SQLAlchemy models directly

Rejected because persistence fields would define the external contract and
private answer data could be leaked accidentally.

### Calculate locks in the frontend

Rejected because clients can be modified and would duplicate progression rules.
The backend must remain authoritative.

### Implement full authentication now

Initially rejected because the assignment explicitly permitted a default
learner and the lesson loop had higher scheduling priority. ADR 005 later uses
the dependency boundary established here to add cookie-based authentication.

### GraphQL

Rejected because the data requirements are small and stable. REST plus OpenAPI
is simpler to implement, test, document, and explain within the assignment.

## Consequences

- More schema classes exist, but the public surface is deliberate and typed.
- Services must explicitly map domain entities into response contracts.
- Authentication can replace the learner dependency without rewriting every
  endpoint; ADR 005 demonstrates that upgrade.
- Exercise correctness cannot be implemented as frontend-only logic.
- OpenAPI documents only fields that learners are permitted to receive.
