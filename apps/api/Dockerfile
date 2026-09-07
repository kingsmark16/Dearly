# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@12.1.0 --activate

WORKDIR /workspace

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN --mount=type=cache,id=dearly-api-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @dearly/api...

FROM base AS build

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /workspace/packages/contracts/node_modules ./packages/contracts/node_modules
COPY . .

ENV NODE_ENV=production

RUN pnpm --filter @dearly/contracts build && \
    pnpm --filter @dearly/api build

# This target retains the Prisma CLI and migration files for a one-shot,
# operator-triggered `prisma migrate deploy` command. It is not the runtime
# image and is only used by the production Compose migration profile.
FROM build AS migration

CMD ["pnpm", "--filter", "@dearly/api", "db:deploy"]

FROM build AS production-dependencies

RUN pnpm deploy --filter @dearly/api --prod --legacy /prod/api

FROM node:${NODE_VERSION} AS runner

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY --from=production-dependencies /prod/api/package.json ./package.json
COPY --from=production-dependencies /prod/api/node_modules ./node_modules
COPY --from=build /workspace/apps/api/dist ./dist

# The API has runtime schema imports from the workspace contracts package.
# Copy its compiled package into the portable deployment created above.
COPY --from=build /workspace/packages/contracts/package.json ./node_modules/@dearly/contracts/package.json
COPY --from=build /workspace/packages/contracts/dist ./node_modules/@dearly/contracts/dist

RUN chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/v1/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/main.js"]
