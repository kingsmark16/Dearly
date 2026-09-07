# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@12.1.0 --activate

WORKDIR /workspace

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN --mount=type=cache,id=dearly-web-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @dearly/web...

FROM base AS build

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/web/node_modules ./apps/web/node_modules
COPY --from=dependencies /workspace/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=dependencies /workspace/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

ARG DEARLY_API_URL=http://api:4000/api/v1
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED=false

ENV NODE_ENV=production
ENV DEARLY_API_URL=${DEARLY_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED=${NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @dearly/web build && \
    if [ -d apps/web/public ]; then \
      cp -R apps/web/public apps/web/.next/standalone/apps/web/public; \
    fi

FROM node:${NODE_VERSION} AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# `output: standalone` contains the minimal Node runtime under the workspace
# path because this is a monorepo application.
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static

RUN chown -R node:node /app

USER node

WORKDIR /app/apps/web

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
