#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting backend entrypoint..."

# Export environment variables
export PYTHONPATH=${PYTHONPATH:-/app}
export DATABASE_URL=${DATABASE_URL:-postgresql+psycopg://postgres:postgres@postgres:5432/terriercheckin}

echo "📊 Database URL: ${DATABASE_URL}"

# Normalize Render 'postgres://' -> 'postgresql+psycopg://' for SQLAlchemy psycopg3
if [[ "${DATABASE_URL:-}" == postgres://* ]]; then
  echo "🔧 Normalizing DATABASE_URL scheme for SQLAlchemy (psycopg3)"
  export DATABASE_URL="postgresql+psycopg://${DATABASE_URL#postgres://}"
fi

# Wait for PostgreSQL to be ready (max 30 seconds)
if [[ "$DATABASE_URL" == postgresql* ]]; then
  echo "⏳ Waiting for PostgreSQL to be ready..."
  
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  until gosu appuser python -c "
from sqlalchemy import create_engine
import sys
try:
    engine = create_engine('${DATABASE_URL}')
    with engine.connect() as conn:
        pass
    print('✅ PostgreSQL is ready!')
    sys.exit(0)
except Exception as e:
    print(f'⚠️  Database not ready yet: {e}')
    sys.exit(1)
" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
      echo "❌ Failed to connect to PostgreSQL after ${MAX_RETRIES} attempts"
      exit 1
    fi
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 1
  done
fi

# Run Alembic migrations
echo "🔄 Running database migrations..."
gosu appuser alembic -c alembic.ini upgrade head
echo "✅ Migrations complete!"

# Start the app as appuser
echo "🎯 Starting application..."
exec gosu appuser "$@"
