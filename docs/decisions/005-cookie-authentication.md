# ADR 005: Cookie authentication and self-registration

- Status: Accepted
- Date: 2026-07-26

## Context

The initial assignment architecture resolved one configured learner on every
request. The project now needs self-registration, real login, protected
per-user data, and an authentication design that remains explainable within the
assignment timeline.

The Next.js frontend and FastAPI backend run on different localhost ports but
share the same site. Learner APIs must remain secure when called without the
frontend.

## Decision

Use:

- `pwdlib` recommended hashing, currently Argon2, for stored passwords;
- a registration service with normalized fields and unique username/email
  enforcement;
- PyJWT with HS256 for an eight-hour signed session;
- an `HttpOnly`, `SameSite=Lax`, path-wide cookie;
- credentialed CORS restricted to the configured frontend origin;
- a FastAPI dependency that validates the token and reloads the user;
- Next.js 16 Proxy for cookie-presence redirects only;
- TanStack Query for current-user server state;
- a feature-isolated frontend authentication module.

The JWT contains only the database user ID and standard timing, issuer, and
audience claims. No password, hash, learner statistics, or authorization rules
are stored in it.

## Why an HttpOnly cookie

An HttpOnly cookie is attached by the browser but unavailable to normal
JavaScript, reducing token exposure if an XSS bug occurs. Storing a bearer token
in `localStorage` would make it directly readable by injected scripts.

SameSite and exact-origin CORS provide appropriate protection for this local
assignment. Future state-changing production endpoints should revisit CSRF
protection alongside deployment topology.

## Why FastAPI reloads the user

A valid signature proves that the API issued the token; it does not prove the
user still exists. Loading the user on every protected request allows deleted
or unavailable accounts to be rejected and keeps authorization close to the
data source.

## Why Proxy is not the security boundary

Proxy provides an early redirect before a protected page renders, but clients
can bypass frontend routing. FastAPI independently verifies every learner API,
so direct HTTP calls receive `401` without a valid session.

## Why a stateless session

The assignment has short-lived browser sessions and no device-management
requirement. A signed token avoids adding a session table, cleanup job, and
revocation workflow before the core lesson loop exists.

If the product later needs per-device session lists, immediate remote logout,
or administrator revocation, move to opaque database-backed sessions.

## Alternatives considered

### Frontend-only credential check

Rejected because client code and browser state can be modified. It would not
protect FastAPI endpoints.

### Token in localStorage

Rejected because JavaScript can read it, increasing the impact of XSS.

### Database session table

Deferred because its revocation benefits do not justify the additional schema
and lifecycle work for this assignment-scale account system.

### Full third-party authentication library

Deferred because social identity, password reset, and MFA are out of scope. The
selected registration and session primitives are standard, narrowly scoped, and
covered by tests.

## Consequences

- Learner endpoints now require a valid cookie session.
- New users register with unique usernames and emails; registration does not
  implicitly authenticate them.
- The browser must use `credentials: "include"` for API requests.
- There is no shared default account or known demo password.
- Production must override the signing secret.
- Stateless tokens cannot be individually revoked before expiry; logout removes
  the browser cookie.
