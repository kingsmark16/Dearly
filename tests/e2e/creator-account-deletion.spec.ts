import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

test('Creator can confirm account deletion and immediately disable a shared Letter', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'creator-account-deletion')
  await createDraft(page, 'Our Story')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await page
    .getByLabel('Secret promise')
    .fill('I will always save you the last piece of cake.')
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const shareUrl = await page
    .getByRole('textbox', { name: 'Letter Share link' })
    .inputValue()

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()

    await page.goto('/creator')
    await page.getByRole('button', { name: 'Delete Creator account' }).click()
    await expect(
      page.getByRole('group', {
        name: 'Confirm Creator account deletion',
      }),
    ).toBeVisible()

    await page
      .getByRole('textbox', { name: 'Type DELETE to confirm' })
      .fill('DELETE')
    await page.getByRole('button', { name: 'Confirm account deletion' }).click()
    await expect(page).toHaveURL(/\/sign-in$/)

    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', {
        name: 'This letter is not available.',
      }),
    ).toBeVisible()
  } finally {
    await viewerContext.close()
  }
})
