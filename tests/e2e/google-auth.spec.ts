import { expect, test } from '@playwright/test'

test('prospective Creator can sign in with the Google provider fixture', async ({
  page,
}) => {
  await page.goto('/sign-in')

  const googleButton = page.getByRole('button', {
    name: 'Continue with Google',
  })
  await expect(googleButton).toBeVisible()
  await googleButton.click()

  await expect(page).toHaveURL(/\/creator$/, { timeout: 10_000 })
  await expect(
    page.getByRole('heading', { name: 'Choose a template' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Welcome, Google Fixture Creator' }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Create draft with Our Story' })
    .click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+$/)
  await expect(
    page.getByRole('heading', { name: 'Edit your Letter Draft' }),
  ).toBeVisible()

  await page.goto('/creator')
  await expect(
    page.getByRole('list', { name: 'Your saved letters' }),
  ).toContainText('Our Story')

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
})
