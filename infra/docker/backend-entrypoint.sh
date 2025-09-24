#!/usr/bin/env bash
set -euo pipefail

# Ensure /data exists and is writable by appuser (for SQLite file)
mkdir -p /data
chown -R appuser:appuser /data || true

# Export env and run migrations as non-root so DB file is owned by appuser
export PYTHONPATH=${PYTHONPATH:-/app}
export DATABASE_URL=${DATABASE_URL:-sqlite:////data/app.db}

gosu appuser alembic -c alembic.ini upgrade head

# Start the app as appuser
exec gosu appuser "$@"
