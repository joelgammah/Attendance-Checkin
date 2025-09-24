# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/vite.config.ts frontend/tsconfig.json frontend/postcss.config.cjs /app/
COPY frontend/index.html /app/index.html
COPY frontend/src /app/src
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate && pnpm install && pnpm build

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
