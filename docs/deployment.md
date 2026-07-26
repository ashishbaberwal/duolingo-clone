# Production deployment

LingoTrail uses two production targets:

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
systemd -> Uvicorn -> FastAPI -> persistent SQLite
```

Live endpoints:

- Frontend: `https://lingotrail-scaler.vercel.app`
- Backend health:
  `https://lingotrail-api-139-59-18-245.sslip.io/api/v1/health`

The browser never calls the DigitalOcean hostname directly. Next.js rewrites
`/api/*` to the server-only `API_PROXY_TARGET`, keeping the authentication
cookie first-party on the Vercel hostname. Local development continues to use
`NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Why a Droplet and why no Docker

DigitalOcean App Platform has an ephemeral local filesystem and does not
support volumes. A deployment or container replacement could therefore delete
SQLite learner progress. The Droplet keeps the database on its persistent disk
at `/var/lib/lingotrail/lingotrail.db`.

The production server runs FastAPI directly rather than inside Docker. This
project has one backend service on one small virtual machine, so a native
systemd deployment has fewer runtime layers and uses less memory. Reproducible
dependencies still come from the committed `uv.lock`.

Docker remains an optional packaging tool in the repository, but it is not part
of the active DigitalOcean runtime.

References:

- [DigitalOcean App Platform storage limits](https://docs.digitalocean.com/products/app-platform/details/limits/)
- [DigitalOcean Droplet features](https://docs.digitalocean.com/products/droplets/details/features/)
- [Vercel monorepo deployments](https://vercel.com/docs/monorepos)

## Server layout

```text
/opt/lingotrail/                         Git checkout
/opt/lingotrail/backend/.venv/           Locked production dependencies
/etc/lingotrail/api.env                  Production environment and secret
/etc/systemd/system/lingotrail-api.service
/etc/caddy/Caddyfile
/var/lib/lingotrail/lingotrail.db        Persistent learner data
```

FastAPI binds only to `127.0.0.1:8000`. The DigitalOcean Cloud Firewall exposes
ports `22`, `80`, and `443`; Caddy is the only public application entry point.

## Deployment files

```text
deploy/digitalocean/.env.example
deploy/digitalocean/Caddyfile
deploy/digitalocean/install.sh
deploy/digitalocean/lingotrail-api.service
frontend/.vercelignore
```

`frontend/.vercelignore` prevents the local frontend `.env` from being compiled
into Vercel builds. Production must use the server-only proxy variable instead
of the local `NEXT_PUBLIC_API_URL`.

## Initial Droplet deployment

Create an Ubuntu 24.04 Droplet with an SSH key and a firewall allowing inbound
SSH, HTTP, and HTTPS. Clone the repository:

```bash
git clone https://github.com/ashishbaberwal/duolingo-clone.git /opt/lingotrail
cd /opt/lingotrail
cp deploy/digitalocean/.env.example deploy/digitalocean/.env
```

If no custom domain is available, an IP-encoded `sslip.io` hostname can provide
DNS for the demo:

```text
lingotrail-api-139-59-18-245.sslip.io -> 139.59.18.245
```

Generate a production authentication secret:

```bash
openssl rand -hex 48
```

Set at least these values in `deploy/digitalocean/.env`:

```text
API_DOMAIN=lingotrail-api-139-59-18-245.sslip.io
FRONTEND_ORIGIN=https://lingotrail-scaler.vercel.app
DATABASE_URL=sqlite:////var/lib/lingotrail/lingotrail.db
AUTH_SECRET_KEY=<generated value>
```

The real `.env` file is ignored by Git and must stay on the server. Run the
idempotent native installer:

```bash
sudo ./deploy/digitalocean/install.sh
```

The installer:

1. installs Caddy, curl, Git, and uv;
2. creates a non-login `lingotrail` Linux user;
3. installs locked production dependencies with `uv sync --frozen --no-dev`;
4. installs the protected production environment file;
5. installs and enables the systemd service;
6. validates and restarts Caddy;
7. verifies that both services are active.

On every API start, systemd runs these steps in order:

```text
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Migrations are repeatable and seeding is idempotent, so restarts neither
duplicate content nor overwrite learner progress.

## Frontend deployment

The local `frontend/` directory is linked to the Vercel project
`ashishbaberwal/lingotrail-scaler`.

Set this server-only variable in Production, Preview, and Development:

```text
API_PROXY_TARGET=https://lingotrail-api-139-59-18-245.sslip.io
```

Do not configure `NEXT_PUBLIC_API_URL` in Vercel. Its absence makes browser
requests same-origin. Deploy with a current Vercel CLI:

```bash
pnpm dlx vercel@latest --cwd frontend --prod --yes
```

## Updating the backend

On the Droplet:

```bash
cd /opt/lingotrail
git pull --ff-only origin main
sudo ./deploy/digitalocean/update.sh
```

`update.sh` refreshes a consistent SQLite safety copy at
`/var/lib/lingotrail/lingotrail-before-deploy.db`, runs the idempotent native
installer, restarts the API, verifies both systemd services, and checks the
local health endpoint. The health probe treats a short connection refusal as a
normal Uvicorn startup window and retries for up to 45 seconds. If readiness
never succeeds, the script prints the service status and recent journal entries
directly in the GitHub Actions log.

### GitHub Actions deployment button

The manual `.github/workflows/deploy-backend.yml` workflow provides a
browser-only production deployment:

```text
GitHub → Actions → Deploy Backend → Run workflow
```

It uses the `production` GitHub environment with:

- secret `DROPLET_SSH_PRIVATE_KEY`;
- secret `DROPLET_KNOWN_HOSTS`;
- variable `DROPLET_HOST`;
- variable `DROPLET_USER`.

The workflow permits only repository reads, prevents overlapping production
deployments, connects with strict SSH host verification, calls `update.sh`,
and verifies the public HTTPS health endpoint. It runs only when manually
dispatched; pushing to `main` alone does not deploy the backend.

Check service state and logs:

```bash
systemctl status lingotrail-api caddy
journalctl -u lingotrail-api -n 100 --no-pager
journalctl -u caddy -n 100 --no-pager
```

The installer updates dependencies and configuration before restarting
services. SQLite remains outside the checkout and is not replaced.

## Backup and restore

Create a consistent SQLite backup while the API remains online:

```bash
sudo -u lingotrail /opt/lingotrail/backend/.venv/bin/python -c \
  'import sqlite3; source=sqlite3.connect("/var/lib/lingotrail/lingotrail.db"); backup=sqlite3.connect("/var/lib/lingotrail/lingotrail-backup.db"); source.backup(backup); backup.close(); source.close()'
```

Copy backups off the Droplet or use a DigitalOcean snapshot policy before
treating the demo as long-lived production.

To restore:

1. stop `lingotrail-api`;
2. retain the current database as a recovery copy;
3. restore a verified backup to `/var/lib/lingotrail/lingotrail.db`;
4. restore ownership to `lingotrail:lingotrail`;
5. start the service and run the smoke test.

Never overwrite the live database while FastAPI is running.

## Production smoke test

1. Open `https://lingotrail-scaler.vercel.app/signup`.
2. Create a unique account, then sign in with those details.
3. Confirm the fresh path shows 0 XP, 0 streak, 5 hearts, and only Basics
   available.
4. Confirm the new account appears as `YOU` on the leaderboard.
5. Complete a lesson and record the XP total.
6. Reload and confirm XP and path progress persist.
7. Open Profile and Leaderboards and confirm both use the new identity.
8. Restart `lingotrail-api` and confirm the XP remains.
9. Check browser/systemd logs and the public backend health endpoint.

## Rollback

- Frontend: promote a previous Vercel deployment.
- Backend code: check out the previous known-good commit, run
  `uv sync --frozen --no-dev`, and restart `lingotrail-api`.
- Schema: use a tested Alembic downgrade only when the migration explicitly
  supports it.
- Data: restore a verified off-server SQLite backup or Droplet snapshot.
