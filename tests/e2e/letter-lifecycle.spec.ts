import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'

async function waitForSave(page: import('@playwright/test').Page) {
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })
}

test('Creator can archive, restore, trash, and permanently delete a Letter', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'letter-lifecycle-owner')
  const letterId = await createDraft(page, 'Our Story')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await page
    .getByLabel('Secret promise')
    .fill('I will always save you the last piece of cake.')
  await waitForSave(page)

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const shareUrl = await page
    .getByRole('textbox', { name: 'Letter Share link' })
    .inputValue()

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })
  const otherCreatorContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()

    const otherCreatorPage = await otherCreatorContext.newPage()
    await createVerifiedCreator(
      otherCreatorPage,
      request,
      'letter-lifecycle-other-owner',
    )
    const unauthorizedStatus = await otherCreatorPage.evaluate(
      async ({ origin, id }) => {
        const response = await fetch(
          `${origin}/api/v1/letters/${encodeURIComponent(id)}/archive`,
          { credentials: 'include', method: 'POST' },
        )
        return response.status
      },
      { id: letterId, origin: apiOrigin },
    )
    expect(unauthorizedStatus).toBe(404)

    await page.goto('/creator')
    const letterRow = page.locator(`[data-letter-id="${letterId}"]`)
    await expect(letterRow).toContainText('Published')

    await letterRow.getByRole('button', { name: 'Archive' }).click()
    await expect(letterRow).toContainText('Archived Letter')
    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', {
        name: 'This letter is not available.',
      }),
    ).toBeVisible()

    await letterRow.getByRole('button', { name: 'Move to Trash' }).click()
    await expect(letterRow).toContainText('Trashed Letter')
    await letterRow.getByRole('button', { name: 'Restore' }).click()
    await expect(letterRow).toContainText('Archived Letter')
    await letterRow.getByRole('button', { name: 'Restore' }).click()
    await expect(letterRow).toContainText('Published')
    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()

    await letterRow.getByRole('button', { name: 'Move to Trash' }).click()
    await expect(letterRow).toContainText('Trashed Letter')
    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', {
        name: 'This letter is not available.',
      }),
    ).toBeVisible()

    await letterRow.getByRole('button', { name: 'Restore' }).click()
    await expect(letterRow).toContainText('Published')

    await letterRow.getByRole('button', { name: 'Move to Trash' }).click()
    await expect(
      letterRow.getByRole('button', { name: 'Permanently delete' }),
    ).toBeVisible()
    await letterRow.getByRole('button', { name: 'Permanently delete' }).click()
    await expect(
      letterRow.getByRole('group', { name: 'Confirm permanent deletion' }),
    ).toBeVisible()
    await letterRow
      .getByRole('button', { name: 'Confirm permanent delete' })
      .click()
    await expect(page.locator(`[data-letter-id="${letterId}"]`)).toHaveCount(0)

    await viewerPage.goto(shareUrl)
    await expect(
      viewerPage.getByRole('heading', {
        name: 'This letter is not available.',
      }),
    ).toBeVisible()
  } finally {
    await viewerContext.close()
    await otherCreatorContext.close()
  }
})

test('Creator can archive and restore a private Draft', async ({
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'draft-lifecycle')
  const letterId = await createDraft(page, 'Our Story')

  await page.goto('/creator')
  const letterRow = page.locator(`[data-letter-id="${letterId}"]`)
  await expect(letterRow).toContainText('Draft')

  await letterRow.getByRole('button', { name: 'Archive' }).click()
  await expect(letterRow).toContainText('Archived Letter')
  await expect(letterRow.getByRole('link')).toHaveCount(0)

  await letterRow.getByRole('button', { name: 'Restore' }).click()
  await expect(letterRow).toContainText('Draft')
  await expect(
    letterRow.getByRole('link', { name: 'Edit Draft' }),
  ).toBeVisible()
})
