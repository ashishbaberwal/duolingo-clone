#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this update script as root or with sudo." >&2
  exit 1
fi

deployment_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "${deployment_dir}/../.." && pwd)"
database_path="/var/lib/lingotrail/lingotrail.db"
backup_path="/var/lib/lingotrail/lingotrail-before-deploy.db"
production_python="${repository_root}/backend/.venv/bin/python"

if [[ -f "${database_path}" ]]; then
  if [[ ! -x "${production_python}" ]]; then
    echo "Cannot back up SQLite: ${production_python} is unavailable." >&2
    exit 1
  fi

  sudo -u lingotrail "${production_python}" - \
    "${database_path}" "${backup_path}" <<'PY'
import sqlite3
import sys

source_path, backup_path = sys.argv[1:3]
source = sqlite3.connect(source_path)
backup = sqlite3.connect(backup_path)

try:
    source.backup(backup)
finally:
    backup.close()
    source.close()
PY

  echo "SQLite safety backup refreshed at ${backup_path}"
fi

"${deployment_dir}/install.sh"
systemctl restart lingotrail-api

systemctl is-active --quiet lingotrail-api
systemctl is-active --quiet caddy

curl \
  --fail \
  --show-error \
  --silent \
  --retry 5 \
  --retry-delay 2 \
  http://127.0.0.1:8000/api/v1/health

echo
echo "Backend update completed successfully."
