# QR Check‑In System (FastAPI + React/Vite)

A minimal, production‑ready scaffold to let organizers create events, generate QR codes, and let attendees scan to check in. Includes CSV export, time‑window enforcement, tests with ≥80% coverage targets, and Dockerized deployment behind Nginx.

## Tech
- **Backend:** FastAPI, SQLAlchemy 2.x, Alembic, JWT auth (testing rule: password == username part of email), pytest + coverage
- **Frontend:** Vite + React + TS + Tailwind v4 (via `@tailwindcss/postcss`), RTL + Vitest + MSW (optional), QR generation via `qrcode`
- **Infra:** Docker multi‑stage builds + `docker-compose` (Nginx static + proxy to backend)

## Running Locally

### Notes:
- zsh extras must be quoted/escaped, e.g. `'.[dev]'`.
- On first backend start, the SQLite DB is created and demo users are seeded.
- Frontend auto‑reloads on changes. Backend auto‑reloads on changes in `backend/app/`.
- Always run backend commands from the `backend/` directory to ensure the SQLite DB is created at `backend/app.db`.
- **Dependencies**: Backend uses both `pyproject.toml` (local dev) and `requirements.txt` (Docker). When adding/updating dependencies, remember to update **both files** manually.
- API base URL: frontend defaults to `http://localhost:8000`. To override:
	```bash
	# from frontend/
	VITE_API_URL=http://localhost:8000 pnpm dev
	```

### First Run (Dev) - MacOS
- Prerequisites:
	- Python 3.11+ (3.13 OK)
	- pip
	- macOS: Command Line Tools recommended (`xcode-select --install`)

- Backend (from repo root):
	```bash
	python3 -m venv .venv && source .venv/bin/activate
	cd backend
	python3 -m pip install -e '.[dev]'
	uvicorn app.main:app --reload
	```
	Visit http://localhost:8000/docs

- Frontend:
	```bash
	cd frontend
	corepack enable && corepack prepare pnpm@9.7.0 --activate
	pnpm install
	pnpm dev
	```
	Visit http://localhost:5173

### Windows First Run (Dev) (Powershell)
- Backend:
	py -3.11 -m venv .venv   |  use what python version you have
	.\.venv\Scripts\Activate.ps1
	cd backend\
	python -m pip install -e '.[dev]'
	uvicorn app.main:app --reload
	```
	Visit http://localhost:8000/docs
- Frontend:
	cd frontend\
	pnpm install
	pnpm dev
	```
	Visit http://localhost:5173

### Daily Local Run
- Backend:
	```bash
	source .venv/bin/activate
	cd backend
	uvicorn app.main:app --reload
	```
- Frontend:
	```bash
	cd frontend
	pnpm dev
	```

### Demo Login
- Organizer: `grayj@wofford.edu`
- Organizer: `clublead@wofford.edu`
- Attendee: `gammahja@wofford.edu`
- Attendee: `martincs@wofford.edu`
- Attendee: `podrebarackc@wofford.edu`
- Organizer: `garrettal@wofford.edu` 
- Admin: `adminterrier@wofford.edu`

## Tests & Coverage

### Backend
```bash
source .venv/bin/activate
cd backend
python -m pytest -q --cov=app --cov-report=term-missing:skip-covered --cov-report=html --cov-fail-under=80
```
HTML report in `backend/htmlcov/index.html`.

#### Other useful backend test commands

| Command | Description |
|---------|-------------|
| `python -m pytest` | Run all tests (no coverage, quick check) |
| `python -m pytest tests/unit/test_deps.py` | Run tests in a specific file |
| `python -m pytest tests/unit/test_events.py::test_event_creation` | Run a specific test function |
| `python -m pytest -p no:cov` | Run all tests without coverage plugin (even if addopts is set) |
| `python -m pytest --lf` | Rerun only tests that failed in the last run |
| `python -m pytest -q` | Run all tests in quiet mode (less output) |


### Frontend
```bash
cd frontend
pnpm test:cov
```
Coverage report in `frontend/coverage/index.html`.

## Windows (Powershell) Test

- Backend:
	py -3.11 -m venv .venv   |  use what python version you have
	.\.venv\Scripts\Activate.ps1
	cd backend\
	python -m pip install -e '.[dev]'
	python -m pytest -q --cov=app --cov-report=term-missing:skip-covered --cov-report=html --cov-fail-under=80

- Frotend:
	py -3.11 -m venv .venv   |  use what python version you have
	.\.venv\Scripts\Activate.ps1
	cd frontend\
	pnpm test:cov


## Database

### SQLite (Development)
- **Location**: `backend/app.db`
- **Auto-creation**: Tables and demo users created on first startup
- **Persistence**: Data persists between app restarts

### Inspecting Database
```bash
sqlite3 backend/app.db ".tables"
sqlite3 backend/app.db "SELECT name, email FROM users;"
sqlite3 backend/app.db "SELECT name, location FROM events;"
```

## Docker

Uses PostgreSQL by default. See **[`POSTGRES_MIGRATION.md`](POSTGRES_MIGRATION.md)** for complete setup guide.

```bash
# Optional: Create .env file 
1. Need a .env file in root directory
2. Need a .env.docker file in frontend/ directory

# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build
```

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000/docs

**IMPORTANT FOR PRODUCTION**
- Update `POSTGRES_PASSWORD` in `.env` to a strong password.
- Update `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` in `.env` with your Auth0 tenant details.
- Update `SECRET_KEY` in `.env` to a strong, random value. Use `openssl rand -hex 32` to generate one.

## Deployment

For production deployment to Render using Docker Hub, see **[`RENDER.md`](RENDER.md)** for the complete guide.

### Automated CI/CD Pipeline

GitHub Actions automatically builds, tests, and pushes Docker images on every push to `main`:

- **Docker Smoke Tests**: Basic health checks ensuring containers start and serve responses
- **Build → Test → Push**: Only validated images reach Docker Hub  
- **Multi-platform**: Images built for `linux/amd64` (Render compatibility)

See `.github/workflows/dockerhub.yml` for workflow details.

## Notes
- Check‑in window opens `checkin_open_minutes` (default 15) **before** start and closes at end.
- Event QR payload is a URL: `/checkin?token=...`. Attendees must be logged in to complete check‑in.
- CSV export route: `GET /api/v1/events/{id}/attendance.csv` (organizer only).

## Troubleshooting
- Backend error `module 'bcrypt' has no attribute '__about__'`: install compatible versions:
	```bash
	python3 -m pip install 'passlib[bcrypt]>=1.7.4' 'bcrypt<4'
	```
- Frontend Tailwind error `ENOENT: no such file or directory, open 'tailwindcss'`: ensure Tailwind is installed:
	```bash
	cd frontend
	pnpm add -D tailwindcss@4.1.13
	```

## Roadmap
- Admin console for org/user management
- Anti‑cheat: rotating tokens, GPS/Bluetooth geofencing, one‑time links
- Mobile version

## Auth0 (local dev env variables)

If you enable Auth0 for local testing, add these env vars to the frontend `.env` (Vite) and backend environment respectively. Replace `YOUR_TENANT_DOMAIN` and `YOUR_SPA_CLIENT_ID` with values from the Auth0 dashboard.

Frontend (`frontend/.env`):
```
VITE_AUTH0_DOMAIN=YOUR_TENANT_DOMAIN            # e.g. dev-xxx.us.auth0.com
VITE_AUTH0_CLIENT_ID=YOUR_SPA_CLIENT_ID
VITE_AUTH0_AUDIENCE=https://attendance-api
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://localhost:8000
```

Backend (export or `backend/.env`):
```
AUTH0_DOMAIN=YOUR_TENANT_DOMAIN
AUTH0_AUDIENCE=https://attendance-api
```

Make sure the Auth0 API Identifier (Audience) exactly matches `AUTH0_AUDIENCE`.