# Render Deployment Quickstart

A short guide for deploying this app to Render using a managed PostgreSQL instance and a Docker image for the backend.

## Prerequisites
- Render account with:
  - A PostgreSQL instance (copy the External Connection string)
  - A Web Service for the backend (Docker image from Docker Hub)
- Docker Hub repo for the backend image (built from `infra/docker/backend.Dockerfile`)

## Required environment variables (Render → Service → Environment)
TODO after Docker Hub Setup: Set these on the backend Web Service in the Render dashboard:

- DATABASE_URL = Postgres connection string. Use the psycopg driver and SSL:
  - Example: `postgresql+psycopg://<user>:<pass>@<host>:5432/<db>?sslmode=require`
  - Note: Our code normalizes `postgres://...` but for `postgresql://...` prefer `postgresql+psycopg://...` explicitly.
- SECRET_KEY = a strong random string
- CORS_ORIGIN = your frontend URL (e.g. `https://your-frontend.onrender.com`)
- Optional Auth0: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`

Nothing else is required; the container’s entrypoint handles DB readiness and migrations.

> TODO: Backend Web Service & Frontend deployment on Render
> - Pending Docker Hub Setup. Once created, set the env vars above on the backend Service.
> - Frontend can be Static Site or Docker; set `VITE_API_URL` to backend URL and align `CORS_ORIGIN`.

## Developer setup: `backend/.env` (local)
While backend/Frontend services on Render are pending, developers can run locally against Render DB. You can comment out Docker Postgres DATABASE_URL in `backend/.env` and update with:

```bash
- `DATABASE_URL=postgresql+psycopg://<user>:<pass>@<host>:5432/<db>?sslmode=require`
```

Notes:
- Since we do not commit real secrets, ask Joel for the actual Render Postgres credentials.
- Do not commit real secrets.

## What the container does on startup
- Waits for PostgreSQL to be reachable using `DATABASE_URL`
- Runs Alembic migrations: `alembic -c alembic.ini upgrade head`
- Starts the API server with Uvicorn on port 8000

Where migrations live:
- Config: `backend/alembic.ini`
- Env: `backend/alembic/env.py`
- Revisions: `backend/alembic/versions/*.py`


## Troubleshooting
- Verify migrations ran: check backend logs for Alembic messages or run:
  - `alembic current` inside the container (Render shell) or query `SELECT version_num FROM alembic_version;`
- SSL errors: ensure `?sslmode=require` is present in `DATABASE_URL`.
- Driver errors: ensure the URL uses `postgresql+psycopg://` (psycopg v3).
- CORS errors: set `CORS_ORIGIN` to your exact frontend origin.

## What’s already in the repo
- `backend/alembic/env.py`: reads `DATABASE_URL` and normalizes driver scheme.
- `backend/app/core/config.py`: normalizes `DATABASE_URL` for psycopg v3.
- `infra/docker/backend-entrypoint.sh`: waits for DB, runs `alembic upgrade head`, starts API.

## Switching databases
- To switch between local Docker Postgres and Render Postgres, just change `DATABASE_URL`.
- The entrypoint will run migrations automatically on each deploy.
