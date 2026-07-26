# Authentication guide

LingoTrail has no shared default learner. A visitor creates an account at
`/signup`, then signs in at `/login` with the username and password they chose.
Each account owns its progress, attempts, hearts, XP, streak, achievements, and
leaderboard identity.

## Registration flow

```text
Signup form
   |
   | POST /api/v1/auth/register
   v
Pydantic normalizes and validates fields
   |
   v
Service checks username/email -> Argon2 hashes password
   |
   v
SQLAlchemy inserts a fresh user in one transaction
   |
   v
201 Created -> login page (no automatic session)
```

Registration accepts:

```json
{
  "display_name": "Trail Explorer",
  "username": "trail-explorer",
  "email": "trail@example.com",
  "password": "StrongPass1"
}
```

Rules:

- display name: 2–100 characters after whitespace normalization;
- username: 3–30 characters, normalized to lowercase, using letters, numbers,
  dots, underscores, and hyphens;
- email: valid, normalized to lowercase, and unique;
- password: 8–128 characters with uppercase, lowercase, and a number.

The frontend checks password confirmation but never sends or stores the
confirmation. Username and email have both application checks and database
unique constraints. The service also catches `IntegrityError`, so concurrent
requests cannot bypass uniqueness through a race condition.

A new user starts with 5 hearts, 500 gems, 0 XP, 0 streak, and a 20 XP daily
goal. No progress rows are copied from another user. The first skill is
available because it has no prerequisite; later skills remain locked.

## Login flow

```text
Login form
   |
   | POST /api/v1/auth/login
   v
SQLAlchemy loads normalized username -> Argon2 verifies password
   |
   v
PyJWT signs user ID + issuer + audience + issued/expiry times
   |
   v
HttpOnly, SameSite=Lax cookie
   |
   +--> Next.js Proxy performs an optimistic cookie-presence redirect
   |
   +--> FastAPI verifies the token and reloads the database user
```

Login accepts:

```json
{
  "username": "trail-explorer",
  "password": "StrongPass1"
}
```

The response contains only safe identity fields. It never returns the JWT,
plaintext password, or password hash in JSON.

Invalid usernames and passwords share one response:

```http
401 Unauthorized
```

```json
{
  "detail": "Invalid username or password."
}
```

The service performs a dummy Argon2 verification when a username does not
exist, reducing the timing difference that could otherwise reveal registered
usernames.

## Endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

## Why registration does not auto-login

The requested product journey explicitly separates account creation from
credential proof. Registration returns the safe new-user identity, then the
browser redirects to login with only the username in the query string. The
password remains in component memory and is never put in a URL.

This also keeps responsibilities clear: registration creates identity; login
creates a session.

## Cookie settings

- `HttpOnly`: blocks JavaScript access to the session token.
- `SameSite=Lax`: limits cross-site cookie sending.
- `Path=/`: makes the session available to protected routes.
- `Max-Age=28800`: the local session expires after eight hours.
- `Secure`: enabled automatically when `APP_ENV=production`.

CORS permits credentials only from the configured `FRONTEND_ORIGIN`. Browser
requests use `credentials: "include"` so the browser attaches the cookie
without exposing it to React.

## Route protection

Next.js 16 `proxy.ts` checks cookie presence before rendering `/` or
`/lesson/*`. This is an optimistic user-experience check, not authorization.

Every learner API independently verifies:

1. JWT signature and fixed HS256 algorithm;
2. required subject, issued-at, expiration, issuer, and audience claims;
3. token expiry;
4. that the corresponding database user still exists.

Direct API calls therefore receive `401` without a valid session even if a
client bypasses frontend routing.

## Password and seed behavior

`users.password_hash` stores Argon2id hashes for registered accounts. The four
seeded leaderboard competitors have an unusable `!` marker, no email, and no
learner history; they make the ranking meaningful but cannot log in.

## Production hardening beyond the assignment

- Keep a random `AUTH_SECRET_KEY` of at least 32 bytes in backend-only
  environment configuration.
- Add rate limiting, suspicious-login monitoring, and optional lockout.
- Add verified-email ownership, password reset, and optional MFA.
- Add CSRF tokens if cross-site deployment or cookie policy changes.
- Use revocable database sessions if immediate per-device invalidation is
  required.
