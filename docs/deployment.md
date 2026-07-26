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
DigitalOcean Droplet - Caddy HTTPS proxy
  |
  v
FastAPI container -> host-mounted SQLite database
```

The browser never calls the DigitalOcean hostname directly. Next.js rewrites
`/api/*` to `API_PROXY_TARGET`, which keeps the authentication cookie
first-party on the Vercel hostname. Local development continues to call
`NEXT_PUBLIC_API_URL=http://localhost:8000` directly.

## Why a Droplet instead of App Platform

DigitalOcean App Platform containers have an ephemeral filesystem and do not
support volumes. Deployments or container replacements would delete SQLite
learner progress. LingoTrail therefore uses one Droplet with
`/var/lib/lingotrail` mounted into the API container at `/var/data`.

References:

- [DigitalOcean App Platform storage limits](https://docs.digitalocean.com/products/app-platform/details/limits/)
- [DigitalOcean Droplet features](https://docs.digitalocean.com/products/droplets/details/features/)
- [Vercel monorepo deployments](https://vercel.com/docs/monorepos)

## Deployment files

```text
backend/Dockerfile
deploy/digitalocean/compose.yaml
deploy/digitalocean/Caddyfile
deploy/digitalocean/.env.example
```

Docker Compose runs:

- `api`: FastAPI, Alembic migrations, idempotent seed data, and Uvicorn;
- `caddy`: HTTPS certificate automation and reverse proxying;
- `caddy_data`: persistent certificate data;
- `caddy_config`: persistent Caddy runtime configuration.

The SQLite file is outside Docker-managed storage at:

```text
/var/lib/lingotrail/lingotrail.db
```

Rebuilding or replacing containers does not remove this host directory.

## Prerequisites

Before creating the Droplet:

1. Authenticate the DigitalOcean CLI or sign in to the control panel.
2. Choose a Droplet region close to the evaluator.
3. Create an Ubuntu Droplet with Docker installed.
4. Add an SSH key; do not enable password-only administration.
5. Allow inbound SSH, HTTP, and HTTPS through a DigitalOcean Cloud Firewall.
6. Point a backend DNS record, such as `api.example.com`, to the Droplet.

Caddy requires the DNS record to resolve before it can obtain the HTTPS
certificate.

## Droplet setup

Clone the public repository and create the persistent directory:

```bash
git clone https://github.com/ashishbaberwal/duolingo-clone.git
cd duolingo-clone
sudo install -d -m 750 -o root -g docker /var/lib/lingotrail
cp deploy/digitalocean/.env.example deploy/digitalocean/.env
```

Generate a production secret on the Droplet:

```bash
openssl rand -base64 48
```

Edit `deploy/digitalocean/.env`:

```text
API_DOMAIN=api.your-domain.example
FRONTEND_ORIGIN=https://lingotrail-scaler.vercel.app
AUTH_SECRET_KEY=<generated value>
```

The `.env` file is ignored by Git and must remain only on the server.

Start the services:

```bash
docker compose \
  --env-file deploy/digitalocean/.env \
  -f deploy/digitalocean/compose.yaml \
  up -d --build
```

Container startup runs these API steps in order:

```text
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Migrations are repeatable, and seeding is idempotent, so redeploys do not
duplicate content or overwrite learner progress.

## Frontend deployment

The local `frontend/` directory is linked to the Vercel project
`ashishbaberwal/lingotrail-scaler`.

Add this server-only variable to Production, Preview, and Development:

```text
API_PROXY_TARGET=https://api.your-domain.example
```

Do not add `NEXT_PUBLIC_API_URL` in Vercel. Its absence makes browser requests
same-origin.

Deploy from the repository root:

```bash
vercel --cwd frontend --prod
```

## Updating the backend

On the Droplet:

```bash
cd duolingo-clone
git pull --ff-only origin main
docker compose \
  --env-file deploy/digitalocean/.env \
  -f deploy/digitalocean/compose.yaml \
  up -d --build
```

Check deployment state:

```bash
docker compose \
  --env-file deploy/digitalocean/.env \
  -f deploy/digitalocean/compose.yaml \
  ps
docker compose \
  --env-file deploy/digitalocean/.env \
  -f deploy/digitalocean/compose.yaml \
  logs --tail=100 api
```

## Backup and restore

Create a consistent SQLite backup without stopping the API:

```bash
docker compose \
  --env-file deploy/digitalocean/.env \
  -f deploy/digitalocean/compose.yaml \
  exec api python -c \
  'import sqlite3; source=sqlite3.connect("/var/data/lingotrail.db"); backup=sqlite3.connect("/var/data/lingotrail-backup.db"); source.backup(backup); backup.close(); source.close()'
```

Copy backups off the Droplet or attach DigitalOcean Block Storage with a
snapshot policy before treating the demo as long-lived production.

For restoration:

1. stop the API container;
2. retain the current database as a recovery copy;
3. restore a verified backup to `/var/lib/lingotrail/lingotrail.db`;
4. start the services and run the smoke test.

Never overwrite the live database while the API is running.

## Production smoke test

1. Open `https://lingotrail-scaler.vercel.app/login`.
2. Sign in with `learner` / `LingoTrail@123`.
3. Confirm the learning path and stats load.
4. Complete a lesson and record the XP total.
5. Reload and confirm XP and path progress persist.
6. Open Profile and Leaderboards.
7. Rebuild the backend containers and verify the XP still exists.
8. Check both browser and container logs for errors.
9. Check `https://api.your-domain.example/api/v1/health`.

## Rollback

- Frontend: promote a previous Vercel deployment.
- Backend: check out the previous known-good commit and rebuild the containers.
- Schema: use a tested Alembic downgrade only when the migration explicitly
  supports it.
- Data: restore a verified off-server SQLite backup or volume snapshot.
