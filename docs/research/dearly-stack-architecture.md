# Dearly stack architecture research

Research date: 2026-09-06

Scope: the proposed Dearly stack for a Next.js frontend and NestJS API in one JavaScript/TypeScript monorepo. The recommendations below assume Dearly v1 has authenticated creators, anonymous recipients who use unlisted share links, one-way letters, template-driven content, media, and a future possibility of recipient replies.

Evidence rule: technical facts are linked to first-party documentation only. Statements labelled “Recommendation” or “Design proposal” are architectural decisions for Dearly, derived from the cited capabilities and the product requirements; they are not claims that a vendor mandates this exact design.

This note is research only. It does not change application source files or package manifests.

## Executive recommendation

Keep the proposed stack, with five important boundaries:

1. Next.js owns the web experience and rendering. NestJS owns the canonical HTTP API, authorization, domain rules, and integrations. [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) · [NestJS modules](https://docs.nestjs.com/modules)
2. Better Auth runs at the NestJS/API boundary. The browser uses the resulting session cookie; Next.js may use a cookie check for navigation, but NestJS must enforce authorization on every protected request. [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs) · [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
3. Prisma is used only from the API and optional worker. Neon PostgreSQL is the durable source of truth. Use Neon’s pooled connection for runtime traffic and a direct connection for Prisma migrations and administrative work. [Prisma PostgreSQL connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/postgresql) · [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
4. Browser media uploads go directly to Cloudflare R2 with short-lived presigned URLs issued by NestJS. R2 credentials never reach Next.js client code or the browser. [Cloudflare user-generated-content reference architecture](https://developers.cloudflare.com/reference-architecture/diagrams/storage/storing-user-generated-content/) · [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
5. Redis is an operational support system for rate limits, short-lived cache/locks, and durable background jobs through BullMQ. It is not the canonical store for letters, revisions, media metadata, or view history. [Redis strings](https://redis.io/docs/latest/develop/data-types/strings/) · [Redis key expiration](https://redis.io/docs/latest/develop/using-commands/keyspace/) · [NestJS queues](https://docs.nestjs.com/techniques/queues)

The resulting production shape is:

```text
Browser
  ├─ Next.js web UI and Server Components
  └─ same-origin /api requests
          │
       Nginx
       ├─ /        -> Next.js web
       └─ /api/*   -> NestJS API, including /api/auth/*
                         ├─ Better Auth + Prisma
                         ├─ domain services + validation
                         ├─ Neon PostgreSQL
                         ├─ Redis
                         └─ Cloudflare R2 through server-issued intents

Optional worker: NestJS standalone worker -> Redis/BullMQ -> Neon/R2
```

This topology is a Dearly design proposal. Nginx’s documented reverse-proxy model forwards client requests to an upstream and can preserve host and client/proxy headers; the API and web routing above applies that model to this monorepo. [Nginx reverse proxy documentation](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

## Compatibility summary

| Area                                 | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Dearly decision                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js and NestJS                   | Next.js App Router uses Server Components by default, while NestJS is a separate server framework with its own HTTP and module boundaries. Next.js also documents that its backend features are not a full replacement for a backend. [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) · [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)                                                                                                                | Keep NestJS as the canonical API; do not duplicate domain writes in Next.js Route Handlers.                                                 |
| NestJS module format and Better Auth | NestJS supports ESM and CommonJS. The current NestJS Prisma recipe documents a CommonJS configuration for its default setup, while Better Auth’s Express integration documents that CommonJS is unsupported and ESM is required. [NestJS CLI overview](https://docs.nestjs.com/cli/overview) · [NestJS migration guide](https://docs.nestjs.com/migration-guide) · [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma) · [Better Auth Express integration](https://better-auth.com/docs/integrations/express)                                        | Start the API as ESM and run an integration smoke test for NestJS + Better Auth + Prisma before broad implementation.                       |
| Prisma and Neon                      | Neon documents a pooled endpoint for application traffic and a direct endpoint for migrations; Prisma’s current PostgreSQL guidance lists Neon as supported and shows separate pooled/direct URLs and driver-adapter options. [Neon connection pooling](https://neon.com/docs/connect/connection-pooling) · [Prisma PostgreSQL connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/postgresql) · [Prisma connection pool](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool) | Runtime uses pooled DATABASE_URL; migrations/admin use DIRECT_URL; one long-lived PrismaClient provider per process.                        |
| Better Auth and NestJS               | Better Auth’s NestJS integration is documented as community maintained and requires Nest’s body parser to be disabled so the auth handler can receive the request body. [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs)                                                                                                                                                                                                                                                                                                      | Mount Better Auth inside the API, protect creator routes with a Nest guard, and explicitly allow only the public viewer endpoints.          |
| R2 and browser uploads               | R2 supports S3-compatible presigned URLs for temporary, operation-specific access; browser use still requires an appropriate CORS policy. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) · [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)                                                                                                                                                                                                                                                                      | Upload directly from the browser to R2 after an API-issued upload intent; store only object keys and metadata in PostgreSQL.                |
| TanStack Query and Server Components | TanStack Query supports hydration and Server Components, but its guide warns that Server Components and client queries create separate data-ownership concerns. [TanStack Query Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)                                                                                                                                                                                                                                                                                       | Use Next.js server fetching for the initial public letter and TanStack Query for interactive creator screens and mutations.                 |
| GSAP and React                       | GSAP documents React integration and context cleanup; Next.js requires browser APIs and event-driven behavior to live behind a Client Component boundary. [GSAP React resources](https://gsap.com/resources/React/) · [GSAP context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context/) · [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)                                                                                                                                                    | Keep GSAP and animation hooks in narrow client components; render the letter content and SEO-relevant structure on the server where useful. |

The main compatibility risk is not that these tools cannot coexist; it is that they have different ownership and module-format assumptions. Recommendation (inference): lock exact versions during implementation and put the ESM/API/auth/Prisma combination into CI before adding feature breadth. [NestJS migration guide](https://docs.nestjs.com/migration-guide) · [Better Auth Express integration](https://better-auth.com/docs/integrations/express) · [Prisma PostgreSQL connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/postgresql)

## Monorepo shape

### Recommended repository layout

Design proposal:

```text
apps/
  web/                 Next.js App Router
  api/                 NestJS ESM HTTP API
  worker/              optional NestJS standalone worker
packages/
  contracts/           request/response schemas and generated API types
  ui/                  shadcn/ui primitives and Dearly design-system code
  config-typescript/   shared TypeScript settings
  eslint-config/       shared lint rules
  tsconfig/            shared tsconfig bases
prisma/
  schema.prisma
  migrations/
  seed/
infra/
  nginx/
compose.yaml
compose.production.yaml
turbo.json
pnpm-workspace.yaml
```

pnpm has built-in workspace support, a shared lockfile, and a workspace protocol for linking local packages. Turborepo is designed around package-manager workspaces, package scripts, task scheduling, and caching, and it can be added incrementally to an existing repository. [pnpm workspaces](https://pnpm.io/workspaces) · [Turborepo documentation](https://turborepo.dev/docs) · [Turborepo repository structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) · [Turborepo existing repository guide](https://turborepo.dev/docs/getting-started/add-to-existing-repository)

Share contracts, UI primitives, and configuration packages; do not share PrismaClient, Better Auth server configuration, R2 secrets, or Redis clients with the Next.js browser bundle. Next.js provides transpilation for selected local monorepo packages through transpilePackages, and it documents server-only packages such as Prisma and pg as packages that may need to remain external to server bundles. [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) · [Next.js serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)

### Ownership rule

The API is the only process allowed to:

- read or write Prisma data;
- create or verify Better Auth sessions;
- decide whether a creator owns a letter;
- transition a letter between draft, published, archived, and trash states;
- create R2 upload/download intents;
- record durable view or media state;
- invalidate durable caches or enqueue background jobs.

The web app may render, collect input, call the API, and maintain temporary UI state. This ownership split is a Dearly recommendation that follows Next.js’s server/client boundary and NestJS’s controller/service structure. [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) · [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)

## Request and query boundaries

### Server-rendered reads

Next.js Server Components can perform asynchronous data fetching and can use an ORM or other server-side data source. Next.js’s backend-for-frontend guidance specifically says that a Server Component should fetch directly from the source rather than calling a Next.js Route Handler that merely proxies the same request. [Next.js Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) · [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)

Recommendation: for a public share page such as /s/<share-token>, the Next.js page can call the NestJS public-letter endpoint from the server using an internal API origin. It should receive a published, immutable view model rather than Prisma records. The page can then pass serializable data into small Client Components for audio controls, click-to-reveal interactions, and animation. Props crossing the server/client boundary must be serializable. [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Browser mutations and interactive creator screens

Recommendation: creator dashboard and editor Client Components call same-origin /api/v1/... endpoints through one Axios instance. Nginx routes those calls to NestJS. This keeps API calls, cookies, and browser origin aligned and leaves the API as the single authorization boundary. Axios documents creating a reusable instance for a larger application, setting a production timeout, and cancelling requests with AbortController. [Axios creating an instance](https://axios.rest/pages/advanced/create-an-instance) · [Axios first steps](https://axios.rest/pages/getting-started/first-steps) · [Axios cancellation](https://axios.rest/pages/advanced/cancellation) · [Nginx reverse proxy documentation](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

Use TanStack Query for server state that benefits from cache invalidation, mutation status, optimistic UI, or refetching:

- creator letter list and detail;
- template catalog;
- editor save/autosave mutations;
- publish/archive/link-regeneration mutations;
- upload-intent and media-processing status;
- creator-only analytics.

Use ordinary React state for local editor state that has not been saved. Do not make both a Server Component fetch and a client Query the authoritative owner of the same mutable editor document. TanStack Query’s SSR guidance describes the hydration model and calls out the risk of having two copies of server state with different freshness. [TanStack Query Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) · [TanStack Query SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

### Proposed API surface

The following is a Dearly contract proposal, not an implementation task:

| Endpoint family                               | Visibility                                           | Responsibility                                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET /api/v1/public/letters/:shareToken        | Anonymous with unlisted token                        | Return the published revision’s safe viewer model. Never return creator-only fields, draft data, or storage credentials.                            |
| GET /api/v1/templates                         | Public or authenticated, depending on catalog policy | Return categories and the templates available in each category. Love Letter, Birthday Letter, and Anniversary Letter are categories, not templates. |
| POST /api/v1/letters                          | Authenticated creator                                | Create a draft from a selected category/template.                                                                                                   |
| GET/PATCH /api/v1/letters/:id                 | Owning creator                                       | Read or update draft content through a validated command.                                                                                           |
| POST /api/v1/letters/:id/publish              | Owning creator                                       | Validate the complete snapshot and publish an immutable revision.                                                                                   |
| POST /api/v1/letters/:id/archive              | Owning creator                                       | Make the letter unavailable to viewers according to Dearly’s product rule.                                                                          |
| POST /api/v1/letters/:id/regenerate-link      | Owning creator                                       | Revoke the previous share capability and issue a new one.                                                                                           |
| POST /api/v1/letters/:id/media/upload-intents | Owning creator                                       | Validate a file request and return a short-lived R2 upload intent.                                                                                  |
| POST /api/v1/media/:id/complete               | Owning creator                                       | Verify that the object exists and mark the media asset ready.                                                                                       |
| GET /api/v1/letters/:id/analytics             | Owning creator                                       | Return creator-only aggregates; do not expose viewer identity in v1.                                                                                |

NestJS provides a ValidationPipe for incoming requests, supports schema-based validation pipes, and can generate an OpenAPI document from the API metadata. Use one validation convention at every controller boundary and publish the generated OpenAPI JSON as a contract artifact. [NestJS validation](https://docs.nestjs.com/techniques/validation) · [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)

### Error and data contracts

Recommendation: every API response should use a stable envelope or a consistently documented resource/error shape. The shared packages/contracts package should contain only browser-safe types and schemas. The API owns conversion from Prisma/domain models to those contracts. This prevents accidental exposure of database columns and keeps the web app independent from Prisma’s generated client.

## Authentication and session ownership

### Where Better Auth belongs

Better Auth’s NestJS integration is community maintained, requires body parsing to be disabled for the auth route, and provides a guard/session-decorator pattern for protecting NestJS routes. [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs)

Recommendation: instantiate Better Auth once in apps/api, mount its handler under /api/auth/*, and keep all session reads and writes in the API. The API should have a narrow anonymous allowlist for public viewer reads and health checks; all creator operations should require a verified session and an ownership check.

Better Auth documents cookie-based session management, database-backed session data, optional secondary storage, session revocation, and cookie security settings. If Redis is configured as Better Auth secondary storage, its documentation says sessions use that secondary storage by default unless database storage is explicitly selected. [Better Auth session management](https://better-auth.com/docs/concepts/session-management) · [Better Auth database concepts](https://better-auth.com/docs/concepts/database) · [Better Auth cookies](https://better-auth.com/docs/concepts/cookies)

Recommendation: keep PostgreSQL as the durable auth/session source for Dearly and explicitly choose database session storage if Redis is present. Use Redis separately for ephemeral operational data. This avoids making an operational cache the only durable record of creator sessions.

### Next.js’s role in auth

Better Auth’s Next.js guidance says a proxy/middleware cookie check can be used for optimistic navigation, but it is not a secure authorization boundary; protected pages, routes, and server actions still need actual session enforcement. [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)

Recommendation: Next.js may hide a creator page when there is no session cookie, but NestJS must re-check the session for every read or write. Never authorize a draft, media object, publish action, archive action, or analytics response based only on a client-side query or a Next.js navigation guard.

### Module-format decision

Better Auth’s Express integration documents that CommonJS is unsupported and ESM is required. NestJS documents both ESM and CommonJS project modes. The current NestJS Prisma recipe also notes a Prisma 7 ESM/CommonJS issue and shows moduleFormat = cjs for its default CommonJS setup. [Better Auth Express integration](https://better-auth.com/docs/integrations/express) · [NestJS CLI overview](https://docs.nestjs.com/cli/overview) · [NestJS migration guide](https://docs.nestjs.com/migration-guide) · [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)

Recommendation: use ESM for the new NestJS API so Better Auth and Prisma 7 can use their documented ESM path without a compatibility shim. This is an inference from the cited constraints, not a vendor requirement. Before implementation expands, run a minimal CI smoke test that starts the API, mounts Better Auth, instantiates Prisma, and executes one authenticated request.

### Sign-in providers

Better Auth documents email/password authentication and Google OAuth configuration, including the need for a base URL and a configured callback URL. [Better Auth email/password](https://better-auth.com/docs/authentication/email-password) · [Better Auth Google authentication](https://better-auth.com/docs/authentication/google)

Recommendation: implement email first and Google second, but keep both behind the same API-owned Better Auth session. Do not put provider secrets in Next.js client code.

## Prisma, PostgreSQL, and Neon

### Connection strategy

Neon’s pooling documentation describes a -pooler endpoint backed by PgBouncer and explains that transaction pooling does not preserve session-level state such as prepared statements, cursors, temporary-table state, or session-level advisory locks. [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)

Prisma’s current connection-pool guidance recommends pooled connections for application traffic, direct connections for migrations or administrative work, and reusing one PrismaClient instance instead of constructing one per request. Prisma’s current PostgreSQL connector guidance lists Neon and shows separate direct/runtime connection URLs. [Prisma connection pool](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool) · [Prisma PostgreSQL connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/postgresql)

Recommendation:

- DATABASE_URL: Neon pooled endpoint for the long-running NestJS API and worker.
- DIRECT_URL: Neon direct endpoint for Prisma CLI migrations and explicit administrative operations.
- One PrismaClient provider per API/worker process, created during module startup and disconnected during graceful shutdown.
- Do not rely on session-level PostgreSQL features through the pooled transaction endpoint.
- Tune connection and pool timeouts deliberately; Neon documents connection timeouts around scale-to-zero and Prisma documents pool timeout configuration. [Neon connection errors](https://neon.com/docs/connect/connection-errors) · [Prisma connection pool](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)

The exact Prisma configuration keys and adapter packages should be checked against the pinned Prisma version during implementation. Prisma’s PostgreSQL connector guide and NestJS’s Prisma recipe have version-specific configuration examples, so the repository should not mix examples from different major-version guides without a smoke test. [Prisma PostgreSQL connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/postgresql) · [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)

### Data model direction

Recommendation: use normal relational tables for identity, ownership, lifecycle, and query-critical data:

```text
User / Better Auth tables
CreatorProfile
Letter
LetterRevision
LetterShareLink
Category
Template
TemplateVersion
MediaAsset
LetterViewEvent or aggregated view tables
Report / moderation records
```

Use PostgreSQL JSONB for the template-specific ordered element tree and field values where the schema is intentionally driven by a template. Keep fields needed for authorization, uniqueness, sorting, lifecycle queries, and reporting as relational columns. PostgreSQL documents JSON/JSONB support and JSONB indexing; it also documents primary-key, unique, foreign-key, and check constraints for protecting relational invariants. [PostgreSQL JSON types](https://www.postgresql.org/docs/current/datatype-json.html) · [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

Publish should create an immutable LetterRevision snapshot. A draft can change after publishing, but the public share endpoint should resolve to the selected published revision. A publish transaction should validate the snapshot, write the revision and state transition together, and commit atomically; PostgreSQL documents transactions as all-or-nothing units. [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

Keep template version and letter revision separate. A template can evolve for future creators without rewriting an already-published letter. This is a Dearly design proposal based on the requirement that templates contain different fields/elements and that published experiences should remain stable.

### Neon development workflow

Neon documents branches as isolated database environments and describes branch-based development and preview workflows. Recommendation: use a local PostgreSQL container for fast offline development and a disposable Neon branch for CI or preview tests that need production-like Neon behavior; never use production credentials in tests. [Neon branching introduction](https://neon.com/docs/guides/branching-intro) · [Neon workflow primer](https://neon.com/docs/get-started-with-neon/workflow-primer)

## Cloudflare R2 media architecture

### Recommended upload flow

Cloudflare’s user-generated-content reference architecture validates the upload request and permissions in the application, then gives the client a signed URL so large content can go directly to object storage rather than through the application server. [Cloudflare user-generated-content reference architecture](https://developers.cloudflare.com/reference-architecture/diagrams/storage/storing-user-generated-content/)

Design proposal:

1. The creator calls NestJS with the letter ID, intended template field, MIME type, byte size, and filename.
2. NestJS authenticates the creator, verifies letter ownership and editability, applies per-letter limits, validates the declared content type/size, creates an opaque object key, and records an uploading MediaAsset row.
3. NestJS returns a short-lived presigned R2 PUT URL. R2 presigned URLs grant temporary access to a specific object and operation, can be used for browser uploads/downloads, and should be treated as bearer tokens. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
4. The browser uploads directly to R2. Configure R2 CORS for the real web origins and only the required methods and headers; Cloudflare documents that browser requests using presigned URLs still need CORS. [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)
5. The browser calls a completion endpoint. NestJS verifies the object with a server-side HEAD/metadata check, validates the stored size/type where possible, and changes the MediaAsset to ready.
6. When a viewer requests a published letter, NestJS authorizes the share token against the active published revision and returns a short-lived GET URL or a controlled media response. The viewer never receives R2 access keys.

R2’s S3 API is compatible with the S3 API and uses an account-specific endpoint; Cloudflare documents auto as the S3 region value. [R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

Cloudflare documents that presigned URLs work with the R2 S3 API domain and not with custom domains. Decide this before choosing a custom media hostname; a custom domain can still be used for a different public-asset strategy or the API can proxy/authorize access. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

### Private versus public media

R2 buckets are not public by default. Cloudflare documents public custom-domain and r2.dev access as separate configurations, and describes r2.dev as intended for non-production use with rate limiting. [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)

Recommendation: keep Dearly media private in v1 and issue access only after the public unlisted share token has been authorized. The letter link is intentionally unlisted, not a promise that object URLs are globally public. If public CDN media is added later, make that a separate, explicit asset-visibility state.

### Large files and cleanup

Cloudflare documents simple uploads for smaller objects and multipart uploads for large or resumable transfers, with limits and an automatic incomplete-multipart cleanup rule. [R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/)

Recommendation: use single PUT for v1 within a conservative application limit, then add multipart uploads when product limits require it. Add a lifecycle rule for orphaned objects and explicitly delete known objects when a letter is permanently removed. Cloudflare documents lifecycle deletion rules and notes that deletion can take time to complete, so keep an orphan-cleanup job rather than relying on an immediate delete. [R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

## Redis responsibilities

Redis strings support values such as counters and cache entries, and Redis key expiration can automatically remove keys after a TTL. [Redis strings](https://redis.io/docs/latest/develop/data-types/strings/) · [Redis key expiration](https://redis.io/docs/latest/develop/using-commands/keyspace/)

Recommendation: use Redis for:

- rate-limit counters for sign-in, share-link abuse, reports, and upload-intent endpoints;
- short-lived upload-intent state and idempotency keys;
- locks around publish, archive, link regeneration, and media completion;
- TTL-based caching of the template catalog and published viewer models;
- BullMQ job state for thumbnail/metadata processing, cleanup, and aggregate analytics.

NestJS documents BullMQ as actively developed, backed by Redis, and suitable for preserving job state across process restarts; it also documents separate worker processes for isolated or blocking work. [NestJS queues](https://docs.nestjs.com/techniques/queues)

Do not make Redis the only durable store for letters, template versions, published snapshots, media metadata, or creator-visible analytics. That is a Dearly durability decision: PostgreSQL/R2 are the durable stores, while Redis’s documented strengths here are counters, expiration, caching, and queue coordination.

Use the official Node Redis client for ordinary application code unless a specific integration requires another client; Redis currently recommends node-redis for most JavaScript use while documenting ioredis as supported. [Redis Node.js client](https://redis.io/docs/latest/develop/clients/nodejs/) · [Redis clients](https://redis.io/docs/latest/develop/clients/)

Do not use bare Redis Pub/Sub as the durable job queue. Redis documents Pub/Sub as a messaging mechanism with at-most-once delivery semantics, while BullMQ supplies the persisted job abstraction Dearly needs. [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) · [NestJS queues](https://docs.nestjs.com/techniques/queues)

If Redis is also configured as Better Auth secondary storage, explicitly decide whether sessions should remain in PostgreSQL; Better Auth documents that secondary storage changes where session data is stored unless database storage is selected. [Better Auth session management](https://better-auth.com/docs/concepts/session-management)

## Docker and Nginx production roles

### Docker

Docker recommends multi-stage builds, small trusted base images, a .dockerignore, pinned base versions, and separating build/test concerns from the final runtime image. [Docker build best practices](https://docs.docker.com/build/building/best-practices/)

Recommendation: build separate images for web, api, and worker, each with a minimal production stage and no development source bind mount. Containers should be stateless; Neon, R2, and Redis hold state outside the container. Compose can use a local PostgreSQL service for development, but production should point at Neon rather than running a second authoritative database.

Docker Compose documents a production override pattern for removing source mounts, changing ports and environment, adding restart policy, and rebuilding services. Compose also documents healthchecks and dependency conditions such as service_healthy for startup ordering. [Compose production](https://docs.docker.com/compose/how-tos/production/) · [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) · [Compose services and healthcheck](https://docs.docker.com/reference/compose-file/services/)

Add API liveness and readiness endpoints. NestJS Terminus documents readiness/liveness checks and service indicators for health endpoints. [NestJS Terminus health checks](https://docs.nestjs.com/recipes/terminus)

### Nginx

Recommendation: make Nginx the single public entry point:

| Path                            | Upstream                        | Reason                                  |
| ------------------------------- | ------------------------------- | --------------------------------------- |
| / and Next static/runtime paths | Next.js                         | Web pages and assets                    |
| /api/auth/*                     | NestJS                          | Better Auth handler and session cookies |
| /api/v1/*                       | NestJS                          | Domain API                              |
| /health/*                       | API or an internal health route | Deployment checks                       |

Configure the proxy to preserve the host and forwarding information needed by the API and authentication layer. Nginx documents proxy_pass and proxy_set_header for forwarding requests and preserving values such as Host and client IP; Better Auth documents that forwarded proxy headers must be trusted and configured carefully. [Nginx reverse proxy documentation](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) · [Better Auth security reference](https://better-auth.com/docs/reference/security)

Use same-origin browser URLs in v1. If separate web and API origins are introduced later, explicitly configure CORS, trusted origins, cookie behavior, and proxy headers; NestJS documents CORS configuration and Better Auth documents trusted-origin and CSRF-related settings. [NestJS CORS](https://docs.nestjs.com/security/cors) · [Better Auth security reference](https://better-auth.com/docs/reference/security) · [Better Auth cookies](https://better-auth.com/docs/concepts/cookies)

Enable Helmet before routes and rate-limit sensitive endpoints. NestJS documents Helmet for security-related headers and its throttler integration for brute-force protection. [NestJS security and Helmet](https://docs.nestjs.com/techniques/security) · [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)

## UI, animation, data fetching, and HTTP clients

### Tailwind CSS and shadcn/ui

Tailwind’s current Next.js guide uses the Tailwind PostCSS package and imports Tailwind from the global stylesheet. shadcn/ui documents a Next.js setup and CLI support for monorepos. [Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs) · [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next)

Recommendation: keep shadcn/ui primitives in packages/ui, keep Dearly-specific composition in apps/web or a Dearly UI package, and treat generated shadcn components as source code that the team owns. Keep template content data-driven; do not let arbitrary template JSON inject arbitrary React components.

### GSAP

GSAP documents React usage and gsap.context() cleanup, including reverting animations and scoping selectors. Browser-only animation APIs belong in Client Components in Next.js. [GSAP React resources](https://gsap.com/resources/React/) · [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context/) · [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

Recommendation: use CSS/Tailwind for simple transitions and GSAP for the letter’s authored timeline, scroll choreography, and click-to-reveal sequences. Give templates a small allow-listed animation vocabulary such as fade, float, reveal, and parallax; do not execute arbitrary animation code from stored template data. Keep animation setup and teardown in a narrow Client Component. Dearly’s current product decision not to implement a reduced-motion branch should remain an explicit accessibility risk to revisit before launch.

### Axios and TanStack Query together

Use native fetch in Next.js Server Components when server-rendering a letter, because Next.js documents server-side data fetching directly from the source. Use Axios in browser components for mutations and request cancellation, with one configured instance and a finite timeout. [Next.js Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) · [Axios first steps](https://axios.rest/pages/getting-started/first-steps) · [Axios creating an instance](https://axios.rest/pages/advanced/create-an-instance) · [Axios cancellation](https://axios.rest/pages/advanced/cancellation)

Use TanStack Query as the client-side server-state cache. Query keys should include the resource and relevant identity/version, for example:

```text
["letters", "list"]
["letters", letterId]
["templates", categorySlug]
["published-letter", shareToken]
["media-upload", mediaId]
```

Invalidate or update affected keys after mutations. If a page is prefetched in a Server Component and hydrated into a Client Component, follow TanStack Query’s per-request server QueryClient and browser-singleton guidance; otherwise keep the public viewer payload server-rendered and avoid unnecessary hydration complexity. [TanStack Query Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

Do not store Better Auth session tokens in localStorage. Prefer the session cookie handled by the auth library and send same-origin requests through Nginx. This is a Dearly security recommendation aligned with Better Auth’s cookie/session model. [Better Auth cookies](https://better-auth.com/docs/concepts/cookies) · [Better Auth session management](https://better-auth.com/docs/concepts/session-management)

## Testing strategy

NestJS is test-runner agnostic and documents @nestjs/testing plus unit and end-to-end testing patterns. Its current examples include Vitest and Supertest-style HTTP testing. [NestJS testing](https://docs.nestjs.com/fundamentals/testing)

Vitest uses Vite’s transformation pipeline and supports TypeScript test files, but its documentation states that TypeScript is transformed rather than type-checked; keep a separate TypeScript check in CI. [Vitest guide](https://vitest.dev/guide/) · [Vitest writing tests](https://vitest.dev/guide/writing-tests)

React Testing Library encourages tests that interact with the DOM as a user would and avoids relying on implementation details. [React Testing Library introduction](https://testing-library.com/docs/react-testing-library/intro/)

Playwright runs browser tests across supported browsers and documents headless/parallel execution, UI mode, and trace support. [Playwright running tests](https://playwright.dev/docs/running-tests) · [Playwright browsers](https://playwright.dev/docs/browsers)

Recommended layers:

| Layer                 | Tooling                                                 | Dearly coverage                                                                                                              |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Domain unit tests     | Vitest                                                  | Publish validation, lifecycle transitions, share-token rules, template snapshot rules, media limits                          |
| API module tests      | NestJS TestingModule + Vitest                           | Controllers, guards, ownership checks, DTO/schema validation, error contracts                                                |
| API integration tests | NestJS HTTP tests + a disposable PostgreSQL/Neon branch | Prisma constraints, transactions, Better Auth session flow, migrations, R2/Redis adapter seams                               |
| UI component tests    | React Testing Library + Vitest                          | Editor fields, template renderer, reveal controls, audio controls, loading/error states                                      |
| Browser E2E           | Playwright through Nginx and Docker Compose             | Sign in, create draft, upload media, publish, open anonymous link, archive/revoke link, confirm recipient cannot reply in v1 |
| Build/contract checks | TypeScript, lint, OpenAPI artifact comparison           | Prevent web/API drift and ensure all workspace packages build                                                                |

The most valuable first E2E is the complete creator-to-recipient path: creator signs in, creates a category/template-backed draft, saves content, uploads a photo, publishes, opens the unlisted link in a clean browser context, and then archives or regenerates the link. That test protects Dearly’s defining behavior better than isolated visual snapshots.

## High-value additions

### pnpm workspaces and Turborepo

Recommendation: add pnpm workspaces and Turborepo when the Next.js/NestJS monorepo is scaffolded. They provide workspace linking and task orchestration without forcing the application to become microservices. [pnpm workspaces](https://pnpm.io/workspaces) · [Turborepo documentation](https://turborepo.dev/docs)

### OpenAPI as the API contract

Recommendation: generate OpenAPI from NestJS and treat the JSON document as a CI artifact. The web client can initially use hand-written typed functions, then adopt generated types/client code once the endpoint shape stabilizes. NestJS documents OpenAPI generation and JSON/YAML output. [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)

### Health checks, Helmet, and rate limiting

Recommendation: add @nestjs/terminus for readiness/liveness, Helmet for security headers, and @nestjs/throttler for sensitive endpoint limits. These are small additions with direct NestJS documentation and are particularly useful for public unlisted links and unauthenticated auth endpoints. [NestJS Terminus](https://docs.nestjs.com/recipes/terminus) · [NestJS security](https://docs.nestjs.com/techniques/security) · [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)

### React Testing Library, Vitest, and Playwright

Recommendation: keep all three testing layers. Vitest is the fast unit/component runner, React Testing Library tests user-visible behavior, and Playwright verifies the real web/API/proxy flow in a browser. Their official documentation supports these roles. [Vitest features](https://vitest.dev/guide/features) · [React Testing Library introduction](https://testing-library.com/docs/react-testing-library/intro/) · [Playwright running tests](https://playwright.dev/docs/running-tests)

## Implementation order

This is the safest dependency order for the first build:

1. Scaffold the pnpm/Turborepo workspace and choose ESM for apps/api.
2. Define category, template, template version, letter, revision, media, and share-link contracts.
3. Set up NestJS validation, OpenAPI, health endpoints, structured errors, and the Prisma singleton.
4. Connect Neon with pooled runtime and direct migration URLs; create the first migration and seed categories/templates.
5. Integrate Better Auth in NestJS and prove email sign-in, Google sign-in, session lookup, and protected ownership checks.
6. Implement draft commands, immutable publish revisions, archive, and share-link regeneration.
7. Implement R2 upload intents, direct browser uploads, completion verification, signed viewer access, and orphan cleanup.
8. Build the Next.js viewer and creator editor; keep server-rendered viewer data separate from client editor state.
9. Add Redis rate limits, idempotency, cache invalidation, and BullMQ jobs only where the first real workflow needs them.
10. Add the API integration and Playwright end-to-end paths before adding many templates.

## Decisions to confirm before coding

These are the remaining choices that deserve a short compatibility spike:

- Pin the Node.js, NestJS, Prisma, Better Auth, and adapter versions together; the cited NestJS Prisma and Better Auth documents show that module format and integration details are version-sensitive. [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma) · [Better Auth Express integration](https://better-auth.com/docs/integrations/express) · [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- Confirm the exact Prisma 7 configuration for ESM, generated-client output, and the PostgreSQL adapter before writing the first migration. [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma) · [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- Decide whether the API and web share one public origin behind Nginx in every environment. Same-origin is the simpler v1 cookie choice; separate origins require explicit CORS, trusted-origin, cookie, and proxy-header tests. [Better Auth cookies](https://better-auth.com/docs/concepts/cookies) · [Better Auth security reference](https://better-auth.com/docs/reference/security) · [NestJS CORS](https://docs.nestjs.com/security/cors)
- Set maximum photo/audio sizes and allowed MIME types before implementing R2 intents; the API must enforce these values, not merely trust browser metadata. R2’s upload and presigned-URL model supports direct transfer, but Dearly’s authorization and product limits remain API responsibilities. [Cloudflare user-generated-content reference architecture](https://developers.cloudflare.com/reference-architecture/diagrams/storage/storing-user-generated-content/) · [R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/)
- Decide whether viewer analytics are event rows, daily aggregates, or both. Redis may buffer or coordinate work, but creator-visible totals need a durable reconciliation path.

## Bottom line

The stack is a good fit for Dearly if ownership is explicit: Next.js renders the experience, NestJS is the only trusted application boundary, Better Auth lives with NestJS, Neon/PostgreSQL owns durable state, R2 owns media bytes, Redis accelerates and coordinates work, and Nginx presents one public origin. [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) · [Better Auth NestJS integration](https://better-auth.com/docs/integrations/nestjs) · [Neon connection pooling](https://neon.com/docs/connect/connection-pooling) · [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) · [NestJS queues](https://docs.nestjs.com/techniques/queues) · [Nginx reverse proxy documentation](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

The first implementation milestone should be a thin vertical slice—email sign-in, one category, one template, one photo, publish, anonymous link viewing, and archive—backed by the integration and E2E tests above.
