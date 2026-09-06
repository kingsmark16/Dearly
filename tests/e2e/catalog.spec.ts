import { expect, test } from '@playwright/test'

test('anonymous Viewer can browse categories and templates', async ({
  page,
}) => {
  await page.goto('/templates')

  await expect(
    page.getByRole('heading', { name: 'Choose a Dearly template' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Love Letter' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Birthday Letter' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Anniversary Letter' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Our Story' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Make a Wish' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Years Together' }),
  ).toBeVisible()
})
