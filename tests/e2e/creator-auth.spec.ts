import { expect, test } from '@playwright/test'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'

test('Creator must verify email before using the protected area', async ({
  page,
  request,
}) => {
  const email = `creator-${Date.now()}@example.com`
  const password = 'CorrectHorseBatteryStaple!'

  await page.goto('/sign-up')
  await page.getByLabel('Name').fill('Test Creator')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create Creator account' }).click()

  await expect(page.getByRole('status')).toContainText('Check your email')

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.locator('p[role="alert"]')).toContainText(
    'Please verify your email before signing in.',
  )

  await page.goto('/creator')
  await expect(page).toHaveURL(/\/sign-in$/)

  let verificationUrl = ''
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${apiOrigin}/api/v1/test/mail/verification?email=${encodeURIComponent(email)}`,
        )

        if (response.status() !== 200) {
          return ''
        }

        const body = (await response.json()) as {
          verificationUrl?: string
        }
        verificationUrl = body.verificationUrl ?? ''
        return verificationUrl
      },
      { timeout: 10_000 },
    )
    .toContain(`${apiOrigin}/api/auth/verify-email?`)

  await page.goto(verificationUrl)
  await expect(page).toHaveURL(/\/creator$/)
  await expect(
    page.getByText('Verified Creator', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/sign-in$/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/creator$/)
  await expect(
    page.getByText('Verified Creator', { exact: true }),
  ).toBeVisible()
})
