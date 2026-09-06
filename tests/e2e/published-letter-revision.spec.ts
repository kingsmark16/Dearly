import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

async function waitForSave(page: import('@playwright/test').Page) {
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })
}

test('unfinished Published edits stay private until the Creator republishes', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'published-revision')
  await createDraft(page, 'Our Story')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await page
    .getByLabel('Secret promise')
    .fill('I will always save you the last piece of cake.')
  await waitForSave(page)

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const shareInput = page.getByRole('textbox', { name: 'Letter Share link' })
  const shareUrl = await shareInput.inputValue()

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(shareUrl)
    await viewerPage.getByRole('button', { name: 'Open letter' }).click()
    await expect(viewerPage.getByRole('main')).toContainText(
      'The first conversation we never wanted to end.',
    )

    await page.goto('/creator')
    await expect(
      page.getByRole('link', { name: 'Edit Published Letter' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Edit Published Letter' }).click()
    await expect(
      page.getByRole('heading', { name: 'Edit your Published Letter' }),
    ).toBeVisible()

    await page
      .getByLabel('Favorite memory')
      .fill('A new memory that is not live yet.')
    await waitForSave(page)

    await viewerPage.goto(shareUrl)
    await viewerPage.getByRole('button', { name: 'Open letter' }).click()
    await expect(viewerPage.getByRole('main')).toContainText(
      'The first conversation we never wanted to end.',
    )
    await expect(viewerPage.getByRole('main')).not.toContainText(
      'A new memory that is not live yet.',
    )

    await page.getByRole('button', { name: 'Publish updates' }).click()
    await expect(page.getByTestId('published-share-tools')).toBeVisible()
    await expect(shareInput).toHaveValue(shareUrl)

    await viewerPage.goto(shareUrl)
    await viewerPage.getByRole('button', { name: 'Open letter' }).click()
    await expect(viewerPage.getByRole('main')).toContainText(
      'A new memory that is not live yet.',
    )
  } finally {
    await viewerContext.close()
  }
})
