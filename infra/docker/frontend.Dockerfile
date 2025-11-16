# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools for node-gyp (needed for packages like canvas)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev

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
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
