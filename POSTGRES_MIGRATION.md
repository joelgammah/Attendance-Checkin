# PostgreSQL Migration Guide

This document explains how to set up and use PostgreSQL for the Attendance Check-In application.

---

## What Changed: SQLite → PostgreSQL

### Why We Migrated
- **SQLite**: Single-file database, good for prototyping, limited concurrency
- **PostgreSQL**: Production-grade database, handles multiple connections, better for deployment

### What This Means for You
- **Local Development**: You need PostgreSQL running (via Docker)
- **Database Schema**: All tables are created via Alembic migrations
- **Data Persistence**: Database data is stored in Docker volumes
- **Connections**: Backend connects to PostgreSQL using SQLAlchemy + psycopg driver

---

## Quick Start

### Option 1: Local Development (Recommended)

**Step 1: Start PostgreSQL**
```bash
# Run from project root: ~/Desktop/Attendance-Checkin
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=terriercheckin \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Step 2: Create Backend Environment File**
```bash
# Run from project root
cd backend
```

Create `backend/.env` with:
```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/terriercheckin
SECRET_KEY=your-secret-key-here-min-32-chars
CORS_ORIGIN=http://localhost:5173
# Auth0 (optional) - set these to enable Auth0 token validation
AUTH0_DOMAIN=dev-your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-audience
```

**Step 3: Install Python Dependencies**
```bash
# Run from backend directory (with venv activated)
cd backend
source ../.venv/bin/activate  # Activate virtual environment
pip install -e '.[dev]'
```

**Step 4: Run Database Migrations**
```bash
# Run from backend directory (with venv activated)
cd backend
alembic upgrade head
```

**Step 5: Start Backend**
```bash
# Run from backend directory (with venv activated)
cd backend
uvicorn app.main:app --reload
```

You should see:
```
✅ Demo users seeded successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Step 6: Start Frontend**
```bash
# Run from project root (new terminal)
cd frontend
pnpm dev
```

Access the app at **http://localhost:5173**

---

### Option 2: Docker Compose (Full Stack)

**Step 1: Create Docker Environment Files**

Create `frontend/.env.docker`:
```env
# Ask for values
VITE_API_URL=/api
VITE_AUTH0_DOMAIN=dev-your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=our-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience
VITE_AUTH0_REDIRECT_URI=http://localhost:8080/callback
```

Create `backend/.env` (same as Option 1, but use internal Docker hostname):
```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/terriercheckin
SECRET_KEY=your-secret-key-here-min-32-chars
CORS_ORIGIN=http://localhost:5173
# Auth0 (optional) - set these to enable Auth0 token validation
AUTH0_DOMAIN=dev-your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-audience
```

**Step 2: Start Everything**
```bash
# Run from project root
docker compose up --build
```

Access the app at **http://localhost:8080**

**What Happens:**
1. PostgreSQL starts and waits for readiness
2. Backend runs `alembic upgrade head` automatically
3. Demo users are seeded on first startup
4. Frontend and backend start

---

## Database Connection Details

| Environment | Host | Port | Database | User | Password |
|-------------|------|------|----------|------|----------|
| **Local Dev** | `localhost` | 5432 | `terriercheckin` | `postgres` | `postgres` |
| **Docker Compose** | `postgres` | 5432 | `terriercheckin` | `postgres` | `postgres` |

**Connection Strings:**
- Local: `postgresql+psycopg://postgres:postgres@localhost:5432/terriercheckin`
- Docker: `postgresql+psycopg://postgres:postgres@postgres:5432/terriercheckin`

---

## Demo User Accounts

After database initialization, these accounts (and more) are available:

| Email | Password | Roles |
|-------|----------|-------|
| `adminterrier@wofford.edu` | `adminterrier` | ADMIN, ORGANIZER, ATTENDEE |
| `grayj@wofford.edu` | `grayj` | ORGANIZER, ATTENDEE |
| `martincs@wofford.edu` | `martincs` | ATTENDEE |

---

## Environment Files Required

### 1. `backend/.env` (Required for both LOCAL development only)

**Location:** `~/Desktop/Attendance-Checkin/backend/.env`
**Purpose:** Used when running backend locally with `uvicorn`

**For Local Development:**
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/terriercheckin
SECRET_KEY=your-secret-key-min-32-characters-long
CORS_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
AUTH0_DOMAIN=dev-your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api
```

**Note:** This file is **NOT used** by Docker Compose. Docker uses environment variables from `docker-compose.yml` defaults or root `.env`.


### 2. `.env` (Optional - Root level for Docker Compose)

**Location:** `~/Desktop/Attendance-Checkin/.env` (project root, NOT in backend folder)

**Purpose:** Overrides `docker-compose.yml` environment variable defaults

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=terriercheckin
POSTGRES_PORT=5432

# Backend Configuration (overrides docker-compose.yml defaults)
DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/terriercheckin
SECRET_KEY=your-production-secret-key
CORS_ORIGIN=http://localhost:8080

# Optional: Auth0
AUTH0_DOMAIN=dev-your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api
```

**Note:** This file is optional. If not present, `docker-compose.yml` uses sensible defaults.
**Important:** Even with root `.env`, you still need:
- `backend/.env` for local development
- `frontend/.env.docker` for Docker Compose frontend builds


### 3. `frontend/.env` (for using Auth0)

**Location:** `~/Desktop/Attendance-Checkin/frontend/.env`

**Purpose:** Used when running frontend locally with `pnpm dev`

```env
VITE_API_URL=http://localhost:8000
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
```

### 4. `frontend/.env.docker` (Required for Docker Compose)

**Location:** `~/Desktop/Attendance-Checkin/frontend/.env.docker`

**Note:** This file is automatically copied to `/app/.env` during Docker build (see `frontend.Dockerfile`)

```env
VITE_API_URL=/api
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api
VITE_AUTH0_REDIRECT_URI=http://localhost:8080/callback
```

---

## Common Database Tasks

### Viewing Database Content

**Quick query (from anywhere):**
The container must be running.
```bash
docker exec -it postgres-dev psql -U postgres -d terriercheckin -c "SELECT email, name FROM users;"
```

**Interactive shell (from anywhere):**
```bash
docker exec -it postgres-dev psql -U postgres -d terriercheckin
```

**Useful SQL commands once in shell:**
```sql
\dt                    -- List all tables
\d users              -- Describe users table structure
SELECT * FROM users;  -- View all users
\q                    -- Exit shell
```

### Database Migrations

**Create a new migration (after changing models):**
```bash
# Run from backend directory with venv activated
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic revision --autogenerate -m "description_of_changes"
```

**Apply pending migrations:**
```bash
# Run from backend directory with venv activated
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic upgrade head
```

**View migration history:**
```bash
# Run from backend directory with venv activated
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic history
```

**Rollback last migration:**
```bash
# Run from backend directory with venv activated
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic downgrade -1
```

### Resetting the Database

**Option 1: Drop and recreate (keeps container):**
```bash
# Run from anywhere
docker exec -it postgres-dev psql -U postgres -c "DROP DATABASE terriercheckin;"
docker exec -it postgres-dev psql -U postgres -c "CREATE DATABASE terriercheckin;"

# Then run migrations
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic upgrade head
```

**Option 2: Remove container and start fresh:**
```bash
# Run from anywhere
docker stop postgres-dev
docker rm postgres-dev
docker volume rm postgres-data

# Recreate container
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=terriercheckin \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine

# Run migrations
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic upgrade head
```

### Managing the PostgreSQL Container

**Check if running:**
```bash
docker ps | grep postgres-dev
```

**Start/Stop/Restart:**
```bash
docker start postgres-dev
docker stop postgres-dev
docker restart postgres-dev
```

**View logs:**
```bash
docker logs postgres-dev
docker logs -f postgres-dev  # Follow logs in real-time
```

---

## Docker Compose Deployment

### Starting the Full Stack

**Run from project root:**
```bash
cd ~/Desktop/Attendance-Checkin
docker compose up --build
```

**Access points:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### Docker Compose Commands

**All commands run from project root: `~/Desktop/Attendance-Checkin`**

```bash
# Start all services (foreground with logs)
docker compose up

# Start in background
docker compose up -d

# Rebuild after code changes
docker compose up --build

# Stop all services (keeps data)
docker compose down

# Stop and delete all data (fresh start)
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f postgres

# Restart a service
docker compose restart backend

# Access PostgreSQL shell
docker compose exec postgres psql -U postgres -d terriercheckin

# Run backend commands
docker compose exec backend alembic history
docker compose exec backend python -m pytest
```

### Development Workflow with Docker Compose

**After making code changes:**
```bash
# Option 1: Rebuild everything (slower but safe)
cd ~/Desktop/Attendance-Checkin
docker compose up --build

# Option 2: Restart just backend (faster, for backend changes only)
cd ~/Desktop/Attendance-Checkin
docker compose restart backend
```

**Creating database migrations:**
```bash
# Run from project root
cd ~/Desktop/Attendance-Checkin
docker compose exec backend alembic revision --autogenerate -m "add_new_field"
docker compose exec backend alembic upgrade head
```

**Resetting database in Docker:**
```bash
# Run from project root
cd ~/Desktop/Attendance-Checkin
docker compose down -v        # Delete everything including data
docker compose up --build     # Start fresh with new DB
```

---

## Using GUI Tools to Connect

You can use database GUI tools to explore and manage your PostgreSQL database.

### TablePlus (Recommended for Mac)

1. Download from https://tableplus.com/
2. Create new connection → PostgreSQL
3. Enter connection details:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `terriercheckin`
   - **User**: `postgres`
   - **Password**: `postgres`
4. Click "Connect"

### pgAdmin (Free, Cross-platform)

1. Download from https://www.pgadmin.org/
2. Register new server
3. Connection tab:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `terriercheckin`
   - **Username**: `postgres`
   - **Password**: `postgres`

### DBeaver (Free, Cross-platform)

1. Download from https://dbeaver.io/
2. New Connection → PostgreSQL
3. Enter connection details (same as above)

---

## Troubleshooting

### "Connection refused" when starting backend

**Problem:** PostgreSQL is not running

**Solution:**
```bash
# Check if running
docker ps | grep postgres

# Start it
docker start postgres-dev

# Or for Docker Compose
cd ~/Desktop/Attendance-Checkin
docker compose up postgres -d
```

### "relation does not exist" errors

**Problem:** Database tables haven't been created

**Solution:**
```bash
# Run migrations
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
alembic upgrade head

# Or in Docker Compose
cd ~/Desktop/Attendance-Checkin
docker compose exec backend alembic upgrade head
```

### Demo users not appearing

**Problem:** Seeding hasn't run or failed

**Solution:**
```bash
# Check if users exist
docker exec -it postgres-dev psql -U postgres -d terriercheckin -c "SELECT COUNT(*) FROM users;"

# If 0, restart backend to trigger seeding
docker stop postgres-dev && docker start postgres-dev
cd ~/Desktop/Attendance-Checkin/backend
source ../.venv/bin/activate
uvicorn app.main:app --reload
```

### Port 5432 already in use

**Problem:** Another PostgreSQL instance is running

**Solution:**
```bash
# Find what's using port 5432
lsof -i :5432

# Stop the conflicting process or change port in docker run:
docker run -d --name postgres-dev \
  -p 5433:5432 \  # Use port 5433 instead
  # ... rest of command
```

---

## Summary for New Developers

### For Local Development:
1. **Clone the repo**
2. **Create `backend/.env`** with database connection string (see Environment Files section)
3. **Start PostgreSQL**: `docker run -d --name postgres-dev ...` (see Quick Start)
4. **Activate venv**: `cd backend && source ../.venv/bin/activate`
5. **Install dependencies**: `pip install -e '.[dev]'`
6. **Run migrations**: `alembic upgrade head`
7. **Start backend**: `uvicorn app.main:app --reload`
8. **Start frontend**: `cd ../frontend && pnpm dev`
9. **Login** with `adminterrier@wofford.edu` / `adminterrier`

### For Docker Compose:
1. **Clone the repo**
2. **Create `backend/.env`** with Docker connection string (host = `postgres`)
3. **Create `frontend/.env.docker`** with Auth0 redirect to `http://localhost:8080/callback`
4. **Optional: Create root `.env`** for environment variables
5. **Run**: `docker compose up --build` from project root
6. **Access**: http://localhost:8080
7. **Login** with `adminterrier@wofford.edu` / `adminterrier`

