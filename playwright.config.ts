import { defineConfig, devices } from '@playwright/test'

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL

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
      env: { PORT: '4000' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @dearly/web dev',
      url: 'http://127.0.0.1:3100',
      env: { PORT: '3100' },
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
