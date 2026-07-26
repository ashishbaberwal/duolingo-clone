# Production deployment

LingoTrail uses two deployment targets:

```text
Browser
  |
  v
Vercel - Next.js frontend
  |
  | same-origin /api rewrite
  v
Render - FastAPI container
  |
  v
Render persistent disk - SQLite database
```

The browser never calls the Render hostname directly. Next.js rewrites `/api/*`
to `API_PROXY_TARGET`, which keeps the authentication cookie first-party on the
Vercel hostname. Local development continues to call
`NEXT_PUBLIC_API_URL=http://localhost:8000` directly.

## Why the backend needs a persistent disk

Render web services use an ephemeral filesystem by default. LingoTrail persists
XP, streaks, hearts, lesson attempts, and skill progress in SQLite, so the
database must live at `/var/data/lingotrail.db` on an attached disk. Only one
backend instance can mount this disk, which is appropriate for the assignment's
small demo workload.

The committed `render.yaml` therefore requests a Starter web service and a 1 GB
persistent disk. This is a paid resource. Do not create the Blueprint until the
repository owner approves the current Render charge.

References:

- [Render persistent disks](https://render.com/docs/disks)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Vercel monorepo deployments](https://vercel.com/docs/monorepos)

## Backend deployment

1. In Render, create a Blueprint from the public GitHub repository.
2. Render detects the root `render.yaml`.
3. Confirm the paid `starter` service and 1 GB disk.
4. Set `FRONTEND_ORIGIN` to the final Vercel origin, without a trailing slash:

   ```text
   https://lingotrail-scaler.vercel.app
   ```

5. Render generates `AUTH_SECRET_KEY`; never copy that value into source code.
6. Deploy the Blueprint.

Container startup runs these steps in order:

```text
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Migrations are repeatable, and seeding is idempotent, so normal redeploys do not
duplicate content or overwrite learner progress. Render checks
`/api/v1/health`.

Record the resulting backend origin, for example:

```text
https://lingotrail-api.onrender.com
```

## Frontend deployment

The local `frontend/` directory is linked to the Vercel project
`ashishbaberwal/lingotrail-scaler`.

Add this server-only environment variable to Production, Preview, and
Development in Vercel:

```text
API_PROXY_TARGET=https://your-render-backend.onrender.com
```

Do not add `NEXT_PUBLIC_API_URL` in Vercel. Its absence makes browser requests
same-origin. `NEXT_PUBLIC_AUTH_COOKIE_NAME` is optional because the committed
default already matches the backend.

Deploy from the repository root:

```bash
vercel --cwd frontend --prod
```

## Production smoke test

1. Open `https://lingotrail-scaler.vercel.app/login`.
2. Sign in with `learner` / `LingoTrail@123`.
3. Confirm the learning path and learner stats load.
4. Complete a lesson and record the XP total.
5. Reload the page and confirm XP and path progress persist.
6. Open Profile and Leaderboards.
7. Redeploy the backend and verify the recorded XP still exists.
8. Check the browser console for errors and warnings.
9. Check the Render health endpoint directly.

## Rollback and recovery

- Frontend: promote a previous Vercel deployment.
- Backend code: use Render's rollback/redeploy control for a previous commit.
- Schema: use an explicit tested Alembic downgrade only when the migration is
  designed to be reversible.
- Data: Render persistent disks have snapshots; restore a snapshot for database
  recovery instead of deleting or replacing the live SQLite file.

Never run destructive SQLite commands or replace `/var/data/lingotrail.db`
during routine deployment.
