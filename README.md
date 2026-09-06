# Dearly

Dearly is a web app for creating personalized interactive letters and sharing
them through unlisted links or QR codes. A Creator has an account; a Viewer
does not need one and can read a letter when they possess its link.

## Current milestone

The repository currently contains the first vertical slice from the ticket
queue:

- `apps/web` renders the public Viewer and Creator experiences with Next.js.
- `apps/api` exposes the canonical public-letter endpoint and Creator API with NestJS.
- `packages/contracts` validates the API response with Zod.
- `packages/ui` contains the first shared shadcn-style UI primitive.
- Better Auth handles email/password authentication and email verification.
- Prisma 7 persists Better Auth users, sessions, accounts, and verification tokens.
- `/letters/our-story` opens a deterministic seeded Published Letter.

The letter seed is intentionally in memory. Creator authentication now uses
the local PostgreSQL service. R2, Redis, and background jobs are introduced at
the tickets that need them, with their ownership and production topology documented in
[`docs/adr/0004-next-nest-monorepo.md`](docs/adr/0004-next-nest-monorepo.md).

## Recommended local setup

Prerequisites:

- Node.js 20.11 or newer
- pnpm 12
- Docker Desktop, when running local PostgreSQL, Redis, or Mailpit

Install dependencies from the repository root:

```powershell
pnpm install
```

If pnpm asks for build-script approval, approve only the named packages that
the install reports. The current workspace needs the native build steps for
`unrs-resolver` and `esbuild`.

Start the web and API apps:

```powershell
pnpm dev
```

Then open:

- Web app: `http://127.0.0.1:3000`
- Development fixture (not a public gallery):
  `http://127.0.0.1:3000/letters/our-story`
- API health: `http://127.0.0.1:4000/api/v1/health`
- Seeded letter JSON: `http://127.0.0.1:4000/api/v1/public/letters/our-story`

Start local infrastructure before using Creator authentication:

```powershell
docker compose up -d
```

This starts PostgreSQL on `5432`, Redis on `6379`, and Mailpit on `8025`.
Create a local environment file only when needed:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env` or any real authentication, database, R2, or Redis
credentials.

Generate the Prisma client and apply local migrations:

```powershell
pnpm --filter @dearly/api db:generate
pnpm --filter @dearly/api db:migrate --name auth
```

Then open `http://127.0.0.1:3000/sign-up`. Dearly sends local verification
emails through Mailpit's SMTP server; view them at `http://127.0.0.1:8025`. A
Creator must verify the email before `/creator` or the protected Creator API
can be used. Production must provide a real SMTP service through the `SMTP_*`
variables; Mailpit is rejected in production configuration.

For a containerized deployment, set `DEARLY_API_URL` to the internal API
service, such as `http://api:4000/api/v1`, and set `WEB_ORIGIN` to the public
web origin. The API refuses to start in production without an explicit CORS
allowlist.

## Verification commands

Run the fast checks from the root:

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

Run the browser acceptance test:

```powershell
$env:PLAYWRIGHT_BROWSER_CHANNEL = 'chrome'
pnpm test:e2e
Remove-Item Env:PLAYWRIGHT_BROWSER_CHANNEL
```

The browser test expects the local PostgreSQL container and its migration to
be available. It starts the API in test mode, which uses an in-memory email
adapter. The verification-link route returns `404` outside test mode.

The test uses port `3100` for the Next.js test server so it does not collide
with an ordinary local development server on `3000`. In CI, install the
Playwright-managed browser instead of relying on the local Chrome channel.

## Architecture at a glance

```text
Viewer or Creator browser
          |
       Next.js web  ---- shared contracts/UI ----
          |                                      |
       /api/v1 via same origin                 NestJS API
                                                 |
                         Prisma -> PostgreSQL/Neon
                         Better Auth -> PostgreSQL sessions
                         R2 -> private media objects
                         Redis -> queues, rate limits, short-lived state
                         Nginx -> public reverse proxy in production
```

The API is the only trusted application boundary. The Next.js app renders and
collects input; it must not import Prisma, Better Auth server configuration,
R2 secrets, or Redis clients. The public Viewer receives a safe published
view-model, never creator-only fields or storage credentials.

See [`CONTEXT.md`](CONTEXT.md) for the product/domain language and
[`docs/research/dearly-stack-architecture.md`](docs/research/dearly-stack-architecture.md)
for the first-party documentation research behind the stack choices.
