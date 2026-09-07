import { test, expect } from '@playwright/test'

import { createDraft, createVerifiedCreator } from './support/creator'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'

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

test('anonymous Viewer can report an active Letter and unavailable reports are rejected', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'report-letter')
  const letterId = await createDraft(page, 'Our Story')

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
  const shareToken = new URL(shareUrl).pathname.split('/').at(-1)

  expect(shareToken).toBeTruthy()

  const invalidReport = await request.post(
    `${apiOrigin}/api/v1/public/letters/not-a-real-letter/report`,
    {
      data: {
        reason: 'other',
      },
    },
  )
  expect(invalidReport.status()).toBe(404)

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(shareUrl)
    await viewerPage.getByRole('button', { name: 'Open letter' }).click()
    await viewerPage.getByRole('button', { name: 'Report this Letter' }).click()

    await viewerPage
      .getByLabel('Report reason')
      .selectOption('inappropriate-content')
    await viewerPage
      .getByLabel('Additional details')
      .fill('Please review this Letter.')
    await viewerPage.getByRole('button', { name: 'Submit report' }).click()

    await expect(viewerPage.getByRole('status')).toHaveText(
      'Thank you. Your report was received.',
    )

    await page.goto('/creator')
    const letterRow = page.locator(`[data-letter-id="${letterId}"]`)
    await letterRow.getByRole('button', { name: 'Archive' }).click()
    await expect(letterRow).toContainText('Archived Letter')

    const unavailableReport = await request.post(
      `${apiOrigin}/api/v1/public/letters/${encodeURIComponent(shareToken!)}/report`,
      {
        data: {
          reason: 'other',
        },
      },
    )
    expect(unavailableReport.status()).toBe(404)

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
