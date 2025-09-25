# QR Check‑In System (FastAPI + React/Vite)

A minimal, production‑ready scaffold to let organizers create events, generate QR codes, and let attendees scan to check in. Includes CSV export, time‑window enforcement, tests with ≥80% coverage targets, and Dockerized deployment behind Nginx.

## Tech
- **Backend:** FastAPI, SQLAlchemy 2.x, Alembic, JWT auth (testing rule: password == username part of email), pytest + coverage
- **Frontend:** Vite + React + TS + Tailwind v4 (via `@tailwindcss/postcss`), RTL + Vitest + MSW (optional), QR generation via `qrcode`
- **Infra:** Docker multi‑stage builds + `docker-compose` (Nginx static + proxy to backend)

## Running Locally

### First Run (Dev)
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

- Notes:
	- zsh extras must be quoted/escaped, e.g. `'.[dev]'`.
	- On first backend start, the SQLite DB is created and demo users are seeded.
	- API base URL: frontend defaults to `http://localhost:8000`. To override:
		```bash
		# from frontend/
		VITE_API_URL=http://localhost:8000 pnpm dev
		```

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
- Organizer: `grayj@wofford.edu` / `grayj`
- Organizer: `clublead@wofford.edu` / `clublead`
- Attendee: `gammahja@wofford.edu` / `gammahja`
- Attendee: `martincs@wofford.edu` / `martincs`
- Attendee: `podrebarack@wofford.edu` / `podrebarack`

## Tests & Coverage

### Backend
```bash
cd backend
pytest -q --cov=app --cov-report=term-missing:skip-covered --cov-report=html --cov-fail-under=80
```
HTML report in `backend/htmlcov/index.html`.

### Frontend
```bash
cd frontend
pnpm test:cov
```
Coverage report in `frontend/coverage/index.html`.

## Docker

```bash
docker compose up --build
```
- Frontend at http://localhost:8080
- Backend internal at `backend:8000`, proxied via Nginx at `/api/`

### Switching to Postgres
1. Uncomment/add a `postgres` service in `docker-compose.yml` (optional) and set `DATABASE_URL=postgresql+psycopg://user:pass@postgres:5432/dbname` for backend.
2. Add `psycopg[binary]` to backend dependencies if needed.
3. Run `alembic upgrade head` (the backend container does this on start).

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
- Wofford SSO integration
- Admin console for org/user management
- Anti‑cheat: rotating tokens, GPS/Bluetooth geofencing, one‑time links
- Attendance detail views and CSV column enrichment (names/emails)# Attendance-Checkin