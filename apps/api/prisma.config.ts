import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Package commands run from apps/api, while the documented .env lives at the
// repository root. Load both locations so Prisma uses the same configuration
// as the Nest application in either workspace layout.
loadEnv({ path: '.env' })
loadEnv({ path: '../../.env' })

const localDatabaseUrl = 'postgresql://dearly:dearly@127.0.0.1:5432/dearly'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI commands should use Neon/direct PostgreSQL connections. The
    // fallback keeps `prisma generate` usable before a local .env exists.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? localDatabaseUrl,
  },
})
