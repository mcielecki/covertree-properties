# Build context: repo root (`docker compose build web`).
# The contract with the web app: `pnpm --filter @covertree/web build` writes static files to apps/web/dist.
FROM node:22-bookworm-slim AS build

RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile --filter @covertree/web...

COPY tsconfig.base.json ./
COPY packages/validation packages/validation
COPY apps/web apps/web

# Vite inlines VITE_* variables at build time; the browser calls this URL directly.
ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
RUN pnpm --filter @covertree/web build

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
