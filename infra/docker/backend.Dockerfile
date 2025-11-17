# ---- build stage ----
FROM python:3.11-slim AS builder
WORKDIR /app
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/alembic.ini /app/
COPY backend/app /app/app
COPY backend/alembic /app/alembic

# ---- runtime ----
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app
WORKDIR /app
COPY --from=builder /usr/local /usr/local
COPY backend /app
# Install gosu to drop privileges and create non-root user
RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 -s /bin/bash appuser \
    && chown -R appuser:appuser /app

COPY infra/docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
