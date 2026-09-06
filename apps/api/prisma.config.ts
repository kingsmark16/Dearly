import 'dotenv/config'
import { defineConfig } from 'prisma/config'

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
