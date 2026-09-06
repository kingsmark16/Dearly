# ADR 0004: Use a Next.js and NestJS monorepo with explicit platform boundaries

- Status: Accepted
- Date: 2026-09-06

## Context

Dearly has two distinct delivery responsibilities:

1. A Next.js application renders the Creator experience and the public Viewer
   experience.
2. A NestJS application owns the canonical API, authorization, persistence,
   media orchestration, reporting, and background-job boundaries.

The product will need Better Auth, Prisma/PostgreSQL, Neon in production,
Cloudflare R2, Redis, Docker, and Nginx. The first vertical slice only needs a
public seeded Letter, so introducing every infrastructure integration before
that slice would make the first feedback loop slower without proving a product
requirement.

## Decision

Use a pnpm workspace with Turborepo:

```text
apps/web        Next.js App Router, Tailwind, shadcn/ui, GSAP
apps/api        NestJS REST API
packages/ui     shared UI primitives
packages/contracts shared Zod schemas and TypeScript API types
```

The API is an ESM application. Relative imports use emitted `.js` suffixes,
and the development server uses `tsx watch`; the production server is built by
Nest and runs the emitted `dist/main.js`.

The boundary rules are:

- Next.js owns page composition and browser interaction, but not domain
  authorization or database access.
- NestJS owns the API contract and all Creator/Viewer authorization decisions.
- Prisma is imported by the API and future worker only; it is never imported by
  the web app.
- `packages/contracts` is the stable seam between API responses and web
  rendering. The API maps domain data to an allowlisted public view model, and
  responses are parsed again at the web boundary before rendering.
- Axios is used through a small API client rather than called from individual
  components. TanStack Query will own client-side server-state caching when
  editor/dashboard interactions are introduced.
- GSAP is isolated to client-only interactive elements. Core content remains
  readable without animation; v1 follows the product decision not to expose a
  reduced-motion setting.

Runtime infrastructure will be adopted in later slices:

- Local development uses Docker Compose for PostgreSQL, Redis, and Mailpit.
- Production uses Neon for PostgreSQL. Runtime connections use the pooled
  database URL; Prisma CLI migrations use a direct connection URL.
- R2 remains private. Nest issues short-lived presigned upload/download URLs;
  R2 credentials never reach the browser.
- Redis is not the source of truth. It is reserved for rate limits, short-lived
  coordination, locks, and BullMQ jobs such as retention cleanup and media
  deletion.
- A future worker process handles durable asynchronous work; the API remains a
  single deployable service until the queue workload justifies a separate
  process.
- Nginx is the public reverse proxy. It routes the web app at `/` and the API at
  `/api`, allowing same-origin cookies in production.
- Production requires explicit `WEB_ORIGIN` and `DEARLY_API_URL` values; local
  defaults are intentionally limited to the loopback development services.

## Consequences

Positive consequences:

- The Creator and Viewer flows can evolve independently without duplicating
  domain rules.
- Shared contracts make API drift visible during typechecking and parsing.
- The same workspace can run local services, browser tests, and production
  builds consistently.
- External infrastructure is introduced at the ticket that needs it, so each
  integration has a focused acceptance test.

Costs and constraints:

- Developers must understand workspace filters and the web/API boundary.
- The first public-letter adapter is intentionally in-memory and must be
  replaced by the Prisma repository in the persistence ticket.
- ESM adds explicit import-suffix rules to the Nest codebase.
- Docker and Nginx configuration must keep the internal service names and
  public routes aligned.

## References

- [NestJS workspaces](https://docs.nestjs.com/cli/monorepo)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js standalone output](https://nextjs.org/docs/app/getting-started/deploying)
- [Prisma with Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs)
- [TanStack Query with Next.js](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
