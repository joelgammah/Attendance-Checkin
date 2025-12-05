# ---- build ----
FROM node:20-bullseye AS build
WORKDIR /app


# Install build tools for node-gyp and canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    libfontconfig1-dev \
    libgdk-pixbuf-2.0-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*


ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/vite.config.ts frontend/tsconfig.json frontend/postcss.config.cjs /app/
# Copy Docker-specific .env file for Auth0 configuration
COPY frontend/.env.docker /app/.env
COPY frontend/index.html /app/index.html
COPY frontend/src /app/src
COPY frontend/public /app/public
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate && pnpm install && pnpm build

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
