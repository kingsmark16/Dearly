import { expect, type APIRequestContext, type Page } from '@playwright/test'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'
const password = 'CorrectHorseBatteryStaple!'

export async function createVerifiedCreator(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`

  await page.goto('/sign-up')
  await page.getByLabel('Name').fill('Preview Test Creator')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create Creator account' }).click()
  await expect(page.getByRole('status')).toContainText('Check your email')

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
    page.getByRole('heading', { name: 'Choose a template' }),
  ).toBeVisible()

  return { email, password }
}

export async function createDraft(page: Page, templateName: string) {
  await page
    .getByRole('button', { name: `Create draft with ${templateName}` })
    .click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+$/)
  await expect(
    page.getByRole('heading', { name: 'Edit your Letter Draft' }),
  ).toBeVisible()

  const url = new URL(page.url())
  return url.pathname.split('/').at(-1)!
}
