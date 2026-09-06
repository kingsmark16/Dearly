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

  await expect(
    page.getByRole('heading', { name: 'Choose a template' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Create draft with Our Story' })
    .click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+$/)
  await expect(
    page.getByRole('heading', { name: 'Edit your Letter Draft' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Saved')

  const saveResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === 'PATCH' &&
      response.url().includes('/api/v1/letters/') &&
      response.ok()
    )
  })
  await page.getByLabel('Letter title').fill('The day we met')
  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await saveResponse
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })

  await page.reload()
  await expect(page.getByLabel('Letter title')).toHaveValue('The day we met')
  await expect(page.getByLabel('Recipient name')).toHaveValue('Alex')
  await expect(page.getByLabel('Favorite memory')).toHaveValue(
    'The first conversation we never wanted to end.',
  )
  await page.getByRole('link', { name: '← Back to Drafts' }).click()
  await expect(
    page.getByRole('list', { name: 'Your saved drafts' }),
  ).toContainText('The day we met')

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
