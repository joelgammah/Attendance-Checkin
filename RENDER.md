# Render Deployment Guide (Docker Hub + Frontend + Backend + Database)

This document describes how our Attendance Check-In system is deployed to Render using Docker Hub images.
It explains the three services, how Docker images are built and pushed, how Render pulls images, and how teammates can update configuration or redeploy.

## Architecture Overview

We deploy three separate services on Render:

### 1. Frontend Web Service

* Render service name: `terriercheckin`
* Docker Hub image: `collinmartin/attendance-checkin:frontend`
* Runs Nginx serving Vite-built static React site
* Proxies all `/api/*` requests to the backend
* **Includes user documentation** at `/docs` route (built into the image)

### 2. Backend Web Service

* Render service name: `attendance-checkin:backend`
* Docker Hub image: `collinmartin/attendance-checkin:backend`
* Runs FastAPI + Uvicorn
* Connects to the Render PostgreSQL database
* Runs Alembic migrations on startup

### 3. PostgreSQL Database

* Render service name: `terriercheckin-postgres`
* Provides the connection string for the backend
* Must be created before deploying the backend

## Deployment Flow

Render does not build from source. It only pulls prebuilt Docker Hub images.

### Automatic (Recommended)

1. Make code changes locally and push to `main` branch
2. GitHub Actions automatically builds and pushes Docker images to Docker Hub if PR passes frontend and backend smoke tests
3. In Render, trigger a new deploy: **Manual Deploy → Deploy latest reference** to deploy the latest images

### Manual (Alternative)

1. Make code changes locally
2. Build and push Docker images manually (see below)
3. In Render, trigger a new deploy
* Note: Manual builds means deploying images built outside of GitHub Actions.

## Building and Pushing Docker Images

### Automatic CI/CD (GitHub Actions)

Every push to `main` branch automatically:
- Builds both frontend and backend images for `linux/amd64`
- Runs smoke tests to validate containers
- Pushes images to Docker Hub with tags:
  - `collinmartin/attendance-checkin:frontend` / `:backend` (latest)
  - `collinmartin/attendance-checkin:frontend-<sha>` / `:backend-<sha>` (versioned)

### Manual Build (When Needed)

If you need to build images manually, Render requires images built for **linux/amd64**, even on Mac (ARM).

### Build and push backend image

```bash
docker buildx build \
  --platform linux/amd64 \
  -f infra/docker/backend.Dockerfile \
  -t collinmartin/attendance-checkin:backend \
  --push .
```

### Build and push frontend image

```bash
docker buildx build \
  --platform linux/amd64 \
  -f infra/docker/frontend.Dockerfile \
  -t collinmartin/attendance-checkin:frontend \
  --push .
```

After pushing, go to Render and trigger a manual deploy.

## Environment Variables

### Frontend Service (`terriercheckin`)

| Key            | Value                                             |
| -------------- | ------------------------------------------------- |
| BACKEND_ORIGIN | `https://attendance-checkin-backend.onrender.com` |

The frontend proxies `/api/*` to this backend URL via Nginx.

### Backend Service (`attendance-checkin:backend`)

| Key            | Value                                 |
| -------------- | ------------------------------------- |
| DATABASE_URL   | Provided by Render DB                 |
| FRONTEND_URL   | `https://terriercheckin.onrender.com` |
| CORS_ORIGIN    | `https://terriercheckin.onrender.com` |
| AUTH0_DOMAIN   | Your Auth0 domain                     |
| AUTH0_AUDIENCE | Your Auth0 audience                   |

Backend automatically waits for the DB, runs migrations, and seeds initial users.

## Auth0 Configuration

These URLs must be added in your Auth0 Application Settings.

### Allowed Callback URLs

```
http://localhost:5173/callback # for local dev
http://localhost:8080/callback # for local docker dev
https://terriercheckin.onrender.com/callback # for production deployment
```

### Allowed Logout URLs

```
http://localhost:5173 
http://localhost:8080
https://terriercheckin.onrender.com
```

### Allowed Web Origins

```
http://localhost:5173
http://localhost:8080
https://terriercheckin.onrender.com
```

### Allowed CORS Origins

```
https://terriercheckin.onrender.com
```

### Required values in `frontend/.env.docker`

```
VITE_API_URL=/api
VITE_AUTH0_REDIRECT_URI=https://terriercheckin.onrender.com/callback
VITE_AUTH0_LOGOUT_REDIRECT_URI=https://terriercheckin.onrender.com
```

## Redeploying a Service

To redeploy using the most recent Docker Hub image:

1. Open the service in Render.
2. Click **Manual Deploy**.
3. Choose **Deploy latest reference**.

Alternatively, saving environment variables also forces a redeploy.

## Viewing Logs

### Frontend logs

Navigate to the `terriercheckin` service → Logs.

### Backend logs

Navigate to the `attendance-checkin` service → Logs.

### Database logs

Visible only when connection errors occur.

## Testing After Deployment

### Health checks

```
https://attendance-checkin-backend.onrender.com/healthz
https://terriercheckin.onrender.com/login
```

### API test

```
https://attendance-checkin-backend.onrender.com/api/v1/users/me
```

### Full application test

Open:

```
https://terriercheckin.onrender.com/
```

Then log in and verify that the dashboard loads correctly.

## Common Problems and Fixes

### Problem: "host not found in upstream backend"

The frontend did not receive the correct backend URL.
Solution: Update BACKEND_ORIGIN, rebuild image, push, redeploy.


### Problem: Render says Docker Image is built for "invalid platform"

Images must be built for `linux/amd64`.
Solution: Rebuild using `--platform linux/amd64`.

### Problem: Callback URL mismatch (Auth0)

Solution: Add the Render callback URL to Auth0 settings.


 (See <attachments> above for file contents. You may not need to search or read the file again.)
