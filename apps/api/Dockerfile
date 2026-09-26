# Build context: repo root (`docker compose build api`).
# Runs the TypeScript source with tsx instead of a compiled bundle, a conscious trade-off (SPEC §6).
FROM node:22-bookworm-slim

# Prisma's schema engine (used by `migrate deploy`) needs OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
# pnpm version comes from `packageManager` in package.json.
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app

# Manifests first, so the dependency layer is cached until they change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/validation/package.json packages/validation/
# Prisma's postinstall (`prisma generate`) needs the schema and config.
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
RUN pnpm install --frozen-lockfile --filter @covertree/api...

COPY tsconfig.base.json ./
COPY packages/validation packages/validation
COPY apps/api apps/api

RUN chown -R node:node /app
USER node
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000

# Migrations run before the server starts; compose starts this only once `db` is healthy.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec pnpm exec tsx src/main.ts"]
