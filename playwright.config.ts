import { defineConfig, devices } from '@playwright/test'

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL
const testDatabaseUrl =
  process.env.DEARLY_TEST_DATABASE_URL ??
  'postgresql://dearly:dearly@127.0.0.1:5432/dearly'
const apiUrl = new URL(
  process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000',
)
const webUrl = new URL(
  process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
)
const apiOrigin = apiUrl.origin
const webOrigin = webUrl.origin
const apiBaseUrl = `${apiOrigin}/api/v1`
const useProductionServers =
  process.env.DEARLY_E2E_SERVER_MODE === 'production' ||
  (process.env.DEARLY_E2E_SERVER_MODE === undefined && Boolean(process.env.CI))
const apiCommand = useProductionServers
  ? 'pnpm --filter @dearly/api start'
  : 'pnpm --filter @dearly/api dev'
const webCommand = useProductionServers
  ? 'pnpm --filter @dearly/web start'
  : 'pnpm --filter @dearly/web dev'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: webOrigin,
    trace: 'on-first-retry',
    ...(browserChannel ? { channel: browserChannel } : {}),
  },
  webServer: [
    {
      command: apiCommand,
      url: `${apiBaseUrl}/health`,
      env: {
        PORT: apiUrl.port || '4000',
        NODE_ENV: 'test',
        DATABASE_URL: testDatabaseUrl,
        DIRECT_URL: testDatabaseUrl,
        BETTER_AUTH_SECRET: 'dearly-playwright-test-secret-that-is-long-enough',
        BETTER_AUTH_URL: apiOrigin,
        WEB_ORIGIN: webOrigin,
        SMTP_FROM: 'noreply@dearly.dev',
      },
      // The API must be started in test mode so the in-memory verification
      // mailbox exists; never reuse an ordinary development API here.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: webCommand,
      url: webOrigin,
      env: {
        PORT: webUrl.port || '3100',
        DEARLY_API_URL: apiBaseUrl,
        NEXT_PUBLIC_API_URL: apiBaseUrl,
        NEXT_PUBLIC_AUTH_URL: apiOrigin,
      },
      reuseExistingServer: !useProductionServers,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
