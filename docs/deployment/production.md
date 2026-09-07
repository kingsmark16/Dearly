# Production deployment

Dearly is prepared for a small, single-host production deployment:

```text
Internet -> Nginx (HTTPS) -> web (Next.js) -> api (NestJS) -> Neon PostgreSQL
                                      |       |             -> managed Redis
                                      |       -> Cloudflare R2 (private media)
                                      -> SMTP and Google OAuth providers
```

The web and API containers are the only Dearly application processes. Postgres,
Redis, object storage, SMTP, and OAuth are managed dependencies. The API uses
the Neon pooled URL for runtime queries and the direct URL only for Prisma
migrations.

## One-time host setup

1. Install Docker Engine and the Compose plugin on a Linux host.
2. Check out the exact commit you want to deploy.
3. Create the production environment file:

   ```sh
   cp infra/deployment/production.env.example .env.production
   ```

4. Replace every `replace-*` value. Treat `.env.production` as a secret file;
   do not commit it or paste it into issue comments.
5. Put the certificate and private key at the paths configured by
   `NGINX_TLS_DIR`:

   ```text
   infra/nginx/tls/fullchain.pem
   infra/nginx/tls/privkey.pem
   ```

   The certificate must cover the hostname in `WEB_ORIGIN`. The HTTP server
   keeps the ACME webroot available and redirects ordinary traffic to HTTPS.

6. Configure the Google OAuth client callback as:

   ```text
   https://your-domain.example/api/auth/callback/google
   ```

   Use the same public origin for `WEB_ORIGIN`, `BETTER_AUTH_URL`, and
   `NEXT_PUBLIC_AUTH_URL`.

## Deploy or update

Run these commands from the repository root:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml --profile migration run --build --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

The migration command runs `prisma migrate deploy` once, before the application
update. It never resets the database. Only run migrations from one operator or
deployment job at a time.

Verify the public origin after the containers report healthy:

```sh
curl --fail https://your-domain.example/api/v1/health
```

A successful response has `status: "ok"` and reports the database and Redis
dependency states. The API refuses to start in production if Redis cannot be
connected, if the production environment is incomplete, or if a local Redis
endpoint is configured.

## Runtime configuration rules

- `DEARLY_API_URL` is private server-to-server traffic (`http://api:4000/api/v1`).
- `NEXT_PUBLIC_API_URL` is compiled into browser JavaScript, so changing it
  requires rebuilding the web image. Keep it same-origin (`/api/v1`) behind
  Nginx.
- `NEXT_PUBLIC_AUTH_URL` is also compiled into browser JavaScript and should be
  the public HTTPS origin. Better Auth is proxied at `/api/auth`.
- `DATABASE_URL` should be the Neon pooled URL. `DIRECT_URL` is for Prisma CLI
  migrations and administrative operations.
- `MEDIA_STORAGE_DRIVER` must be `r2` in production. R2 credentials are used
  server-side; media delivery remains private and presigned.
- Keep all credentials in the host environment, a secret manager, or an
  encrypted deployment store. Do not put them in Dockerfiles or the image.

## Logs, rollback, and recovery

Inspect service logs with:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml logs --since=10m api web nginx
```

For a rollback, deploy the previous known-good application commit and image
again, then run `up -d`. Database migrations are forward-only: if the new code
requires a migration, the rollback code must remain compatible with the already
applied schema. Prefer an additive migration followed by a later cleanup
migration.

Before production use, enable Neon point-in-time recovery/backups and document
the restore owner and restore test cadence. Configure Cloudflare R2 recovery or
object-retention controls appropriate for the media policy. A backup that has
never been restored is not a verified recovery plan.

## Staging smoke test

Before the first production deploy, run the browser suite against a staging
origin with non-production credentials and a disposable database. Confirm:

- creator email sign-up, verification, and sign-in;
- Google sign-in and its callback;
- category/template selection and letter creation;
- private media upload through R2 and public letter viewing;
- share-link regeneration and archived-letter behavior; and
- the public health endpoint through Nginx.

Viewer replies and reactions remain out of scope for this deployment work.
