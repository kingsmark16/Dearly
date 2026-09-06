import { defineConfig, devices } from '@playwright/test'

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL
const testDatabaseUrl =
  process.env.DEARLY_TEST_DATABASE_URL ??
  'postgresql://dearly:dearly@127.0.0.1:5432/dearly'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
    ...(browserChannel ? { channel: browserChannel } : {}),
  },
  webServer: [
    {
      command: 'pnpm --filter @dearly/api dev',
      url: 'http://127.0.0.1:4000/api/v1/health',
      env: {
        PORT: '4000',
        NODE_ENV: 'test',
        DATABASE_URL: testDatabaseUrl,
        DIRECT_URL: testDatabaseUrl,
        BETTER_AUTH_SECRET: 'dearly-playwright-test-secret-that-is-long-enough',
        BETTER_AUTH_URL: 'http://127.0.0.1:4000',
        WEB_ORIGIN: 'http://127.0.0.1:3100',
        SMTP_FROM: 'noreply@dearly.dev',
      },
      // The API must be started in test mode so the in-memory verification
      // mailbox exists; never reuse an ordinary development API here.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @dearly/web dev',
      url: 'http://127.0.0.1:3100',
      env: {
        PORT: '3100',
        NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000/api/v1',
        NEXT_PUBLIC_AUTH_URL: 'http://127.0.0.1:4000',
      },
      reuseExistingServer: !process.env.CI,
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
