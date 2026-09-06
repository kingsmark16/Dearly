import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

async function waitForDraftSave(page: import('@playwright/test').Page) {
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })
}

test('Creator publishes a Letter and an anonymous Viewer reads the Share link', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'publish-letter')
  await createDraft(page, 'Our Story')

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const publishPanel = page.getByTestId('publish-letter-panel')
  await expect(publishPanel).toContainText('Recipient name')
  await expect(publishPanel).toContainText('Favorite memory')
  await expect(publishPanel).toContainText('required before publishing')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Favorite memory')
    .fill('The first conversation we never wanted to end.')
  await page
    .getByLabel('Secret promise')
    .fill('I will always save you the last piece of cake.')
  await waitForDraftSave(page)

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  await expect(page.getByTestId('published-share-tools')).toBeVisible()

  const shareInput = page.getByRole('textbox', { name: 'Letter Share link' })
  const shareUrl = await shareInput.inputValue()
  expect(new URL(shareUrl).pathname).toMatch(/^\/letters\/[A-Za-z0-9_-]{40,}$/)
  await expect(page.locator('[data-qr-value]')).toHaveAttribute(
    'data-qr-value',
    shareUrl,
  )
  await expect(
    page.getByAltText('QR code for the Letter Share link'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download QR code' }),
  ).toBeVisible()

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()

  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const viewerPage = await viewerContext.newPage()
    await viewerPage.goto(shareUrl)

    await expect(viewerPage.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex.*nofollow|nofollow.*noindex/,
    )
    await expect(
      viewerPage.getByRole('heading', { name: 'A little piece of us' }),
    ).toBeVisible()
    await viewerPage.getByRole('button', { name: 'Open letter' }).click()
    await expect(
      viewerPage.locator('[data-viewer-stage="story"]'),
    ).toBeVisible()
    await expect(viewerPage.getByRole('main')).toContainText(
      'The first conversation we never wanted to end.',
    )
    await viewerPage.getByRole('button', { name: 'Tap to reveal' }).click()
    await expect(viewerPage.getByRole('main')).toContainText(
      'I will always save you the last piece of cake.',
    )
  } finally {
    await viewerContext.close()
  }
})

test('Published media is available to the anonymous Viewer through the access boundary', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'publish-media')
  await createDraft(page, 'The Little Things')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('The little things')
    .fill('The small details make every day feel like ours.')
  await page.getByLabel('Shared photos').setInputFiles([
    { name: 'first-memory.png', mimeType: 'image/png', buffer: onePixelPng },
    { name: 'second-memory.png', mimeType: 'image/png', buffer: onePixelPng },
  ])
  await expect(
    page.getByRole('list', { name: 'Shared photos uploads' }).locator('li'),
  ).toHaveCount(2, { timeout: 10_000 })
  await waitForDraftSave(page)

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
    await viewerPage.getByRole('button', { name: 'Begin reading' }).click()

    const gallery = viewerPage.getByRole('list', {
      name: 'A few favorite frames photos',
    })
    await expect(gallery.getByRole('img')).toHaveCount(2)
    await expect(gallery.getByRole('img').first()).toHaveAttribute(
      'src',
      /\/api\/v1\/media\/downloads\//,
    )
    await expect(gallery.getByRole('img').first()).not.toHaveAttribute(
      'src',
      /private|objectKey|r2\.cloudflarestorage\.com/,
    )
  } finally {
    await viewerContext.close()
  }
})
