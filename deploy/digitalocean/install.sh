#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root or with sudo." >&2
  exit 1
fi

deployment_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "${deployment_dir}/../.." && pwd)"
environment_file="${deployment_dir}/.env"

if [[ ! -f "${environment_file}" ]]; then
  echo "Missing ${environment_file}. Copy .env.example and configure it first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

: "${API_DOMAIN:?API_DOMAIN is required}"
: "${AUTH_SECRET_KEY:?AUTH_SECRET_KEY is required}"

if [[ ! "${API_DOMAIN}" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "API_DOMAIN contains unsupported characters." >&2
  exit 1
fi

if [[ "${AUTH_SECRET_KEY}" == replace-with-* ]]; then
  echo "Replace AUTH_SECRET_KEY with a generated production secret." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y caddy curl git

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh |
    env UV_INSTALL_DIR=/usr/local/bin sh
fi

if ! id lingotrail >/dev/null 2>&1; then
  useradd \
    --system \
    --home-dir /var/lib/lingotrail \
    --shell /usr/sbin/nologin \
    lingotrail
fi

install -d -m 750 -o lingotrail -g lingotrail /var/lib/lingotrail
install -d -m 750 -o root -g lingotrail /etc/lingotrail

cd "${repository_root}/backend"
/usr/local/bin/uv sync --frozen --no-dev

install \
  -m 640 \
  -o root \
  -g lingotrail \
  "${environment_file}" \
  /etc/lingotrail/api.env

install \
  -m 644 \
  "${deployment_dir}/lingotrail-api.service" \
  /etc/systemd/system/lingotrail-api.service

sed 's|{\$API_DOMAIN}|'"${API_DOMAIN}"'|g' \
  "${deployment_dir}/Caddyfile" \
  > /etc/caddy/Caddyfile

caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile

systemctl daemon-reload
systemctl enable --now lingotrail-api
systemctl restart caddy

systemctl is-active --quiet lingotrail-api
systemctl is-active --quiet caddy

echo "LingoTrail API is running at https://${API_DOMAIN}"
