import { test, expect } from '@playwright/test'

test('anonymous Viewer can open the seeded Published Letter', async ({
  page,
}) => {
  await page.goto('/letters/our-story')

  await expect(
    page.getByRole('heading', { name: 'A little piece of us' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open letter' })).toBeVisible()

  await page.getByRole('button', { name: 'Open letter' }).click()

  await expect(page.getByRole('button', { name: 'Open letter' })).toHaveCount(0)
  await expect(page.getByRole('main')).toContainText(
    'Every moment with you feels like home.',
  )
  await expect(
    page.getByRole('heading', { name: 'The moments I keep' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'A small promise' }),
  ).toBeVisible()
})
