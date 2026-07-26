# Authentication guide

LingoTrail includes one local demo account for the assignment:

```text
Username: learner
Password: LingoTrail@123
```

Open `http://localhost:3000/login` after starting both applications. These
credentials are intentionally documented for local evaluation; they are not
production credentials.

## Request flow

```text
Login form
   |
   | POST /api/v1/auth/login
   v
FastAPI validates input
   |
   v
SQLAlchemy loads user -> Argon2 verifies password
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

The cookie is never read by frontend JavaScript. Browser requests use
`credentials: "include"`, allowing the browser to attach it automatically.

## Endpoints

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Login accepts JSON:

```json
{
  "username": "learner",
  "password": "LingoTrail@123"
}
```

The response contains only safe learner identity fields. It does not return the
JWT or password hash in JSON.

Invalid usernames and invalid passwords return the same response:

```http
401 Unauthorized
```

```json
{
  "detail": "Invalid username or password."
}
```

The service performs a dummy Argon2 verification when the username does not
exist, reducing the timing difference that could otherwise reveal registered
usernames.

## Cookie settings

- `HttpOnly`: blocks JavaScript access to the session token.
- `SameSite=Lax`: limits cross-site cookie sending.
- `Path=/`: makes the session available to protected routes.
- `Max-Age=28800`: the local session expires after eight hours.
- `Secure`: enabled automatically when `APP_ENV=production`.

CORS permits credentials only from the configured `FRONTEND_ORIGIN`.

## Route protection

Next.js 16 `proxy.ts` checks whether the cookie exists before rendering `/` or
`/lesson/*`. This is only an optimistic user-experience check.

Every learner API uses the FastAPI learner dependency, which verifies:

1. JWT signature and fixed HS256 algorithm.
2. Required subject, issued-at, expiration, issuer, and audience claims.
3. Token expiry.
4. A corresponding user still exists in the database.

Authorization therefore remains secure even if a client bypasses the Next.js
redirect or calls FastAPI directly.

## Password storage and seed behavior

`users.password_hash` stores an Argon2id hash. Other leaderboard-only users
receive the unusable marker `!`; only the configured demo learner can log in.

The seed command is idempotent. On an existing database it upgrades the demo
learner's password hash without recreating course content or losing progress.

## Production changes

Before production:

- Generate a random `AUTH_SECRET_KEY` of at least 32 bytes.
- The API deliberately refuses to start in production with the documented
  development secret or a secret shorter than 32 characters.
- Override `DEMO_LEARNER_PASSWORD` or replace demo seeding entirely.
- Serve frontend and API over HTTPS so the cookie is `Secure`.
- Add rate limiting and login-attempt monitoring.
- Add account registration, password reset, and optional MFA as product needs
  require.
- Consider revocable database sessions if immediate server-side invalidation
  across devices is required.
