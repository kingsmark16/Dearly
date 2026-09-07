import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'

async function waitForSave(page: import('@playwright/test').Page) {
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })
}

test('Creator can regenerate a Share link and see aggregate Viewer analytics', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'share-link-analytics-owner')
  const letterId = await createDraft(page, 'Our Story')

  const saveResponse = page.waitForResponse((response) => {
    return (
      response.request().method() === 'PATCH' &&
      response.url().includes('/api/v1/letters/') &&
      response.ok()
    )
  })
  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await page
    .getByLabel('Secret promise')
    .fill('I will always save you the last piece of cake.')
  await saveResponse
  await waitForSave(page)

  await page.getByRole('link', { name: 'Preview Letter' }).click()
  await page.getByRole('button', { name: 'Open letter' }).click()
  await expect(
    page.getByRole('heading', { name: 'The moments I keep' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to editor' }).click()
  await page.getByRole('button', { name: 'Publish Letter' }).click()

  const originalShareUrl = await page
    .getByRole('textbox', { name: 'Letter Share link' })
    .inputValue()
  await expect(page.getByTestId('letter-view-analytics')).toContainText(
    '0 Views',
  )

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })
  const otherCreatorContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(originalShareUrl)
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()
    await viewerPage.reload()
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()

    await page.reload()
    await expect(page.getByTestId('letter-view-analytics')).toContainText(
      '2 Views',
    )

    const otherCreatorPage = await otherCreatorContext.newPage()
    await createVerifiedCreator(
      otherCreatorPage,
      request,
      'share-link-analytics-other-owner',
    )
    const unauthorizedStatus = await otherCreatorPage.evaluate(
      async ({ origin, id }) => {
        const response = await fetch(
          `${origin}/api/v1/letters/${encodeURIComponent(id)}/regenerate-link`,
          { credentials: 'include', method: 'POST' },
        )
        return response.status
      },
      { id: letterId, origin: apiOrigin },
    )
    expect(unauthorizedStatus).toBe(404)

    await page.getByRole('button', { name: 'Regenerate Share link' }).click()
    const replacementShareInput = page.getByRole('textbox', {
      name: 'Letter Share link',
    })
    await expect(replacementShareInput).not.toHaveValue(originalShareUrl)
    const replacementShareUrl = await replacementShareInput.inputValue()
    await expect(page.locator('[data-qr-value]')).toHaveAttribute(
      'data-qr-value',
      replacementShareUrl,
    )
    await expect(page.getByTestId('letter-view-analytics')).toContainText(
      '2 Views',
    )

    await viewerPage.goto(originalShareUrl)
    await expect(
      viewerPage.getByRole('heading', {
        name: 'This letter is not available.',
      }),
    ).toBeVisible()
    await viewerPage.goto(replacementShareUrl)
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()
  } finally {
    await viewerContext.close()
    await otherCreatorContext.close()
  }
})
