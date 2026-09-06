import { expect, test } from '@playwright/test'
import { createDraft, createVerifiedCreator } from './support/creator'

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

function createWavBuffer(durationSeconds: number) {
  const sampleRate = 8_000
  const channels = 1
  const bitsPerSample = 8
  const dataSize = sampleRate * durationSeconds * (bitsPerSample / 8)
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28)
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  buffer.fill(128, 44)

  return buffer
}

async function waitForDraftSave(page: import('@playwright/test').Page) {
  await expect(page.getByRole('status')).toHaveText('Saved', {
    timeout: 10_000,
  })
}

test('Creator can preview the Template story and reveal optional content', async ({
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'preview-story')
  await createDraft(page, 'Our Story')

  await page.getByRole('link', { name: 'Preview Letter' }).click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+\/preview$/)
  await expect(
    page.getByRole('heading', { name: 'A little piece of us' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open letter' })).toBeVisible()

  await page.getByRole('button', { name: 'Open letter' }).click()
  await expect(page.getByTestId('preview-publish-blockers')).toContainText(
    'Recipient name is required before publishing.',
  )
  await expect(page.getByTestId('preview-publish-blockers')).toContainText(
    'Favorite memory is required before publishing.',
  )
  await expect(
    page.getByRole('heading', { name: 'A small promise' }),
  ).toHaveCount(0)

  await page.getByRole('link', { name: 'Back to editor' }).click()
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
  await waitForDraftSave(page)

  const publicRequests: string[] = []
  page.on('request', (requestEvent) => {
    if (requestEvent.url().includes('/api/v1/public/letters/')) {
      publicRequests.push(requestEvent.url())
    }
  })

  await page.getByRole('link', { name: 'Preview Letter' }).click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+\/preview$/)
  await page.getByRole('button', { name: 'Open letter' }).click()

  await expect(
    page.getByRole('heading', { name: 'The moments I keep' }),
  ).toBeVisible()
  await expect(page.getByRole('main')).toContainText(
    'The first conversation we never wanted to end.',
  )
  await expect(
    page.getByRole('button', { name: 'Tap to reveal' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Tap to reveal' }).click()
  await expect(page.getByRole('main')).toContainText(
    'I will always save you the last piece of cake.',
  )
  await expect(page.locator('[data-animation-token="hearts"]')).toHaveAttribute(
    'data-animation-trigger',
    'on-scroll',
  )
  expect(publicRequests).toEqual([])
})

test('Creator preview preserves photo order and exposes non-autoplay audio controls', async ({
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'preview-media')
  await createDraft(page, 'The Little Things')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('The little things')
    .fill('The small details make every day feel like ours.')
  await page.getByLabel('Shared photos').setInputFiles([
    { name: 'first-memory.png', mimeType: 'image/png', buffer: onePixelPng },
    { name: 'second-memory.png', mimeType: 'image/png', buffer: onePixelPng },
  ])

  const uploads = page.getByRole('list', { name: 'Shared photos uploads' })
  await expect(uploads.locator('li')).toHaveCount(2, { timeout: 10_000 })
  await uploads
    .locator('li')
    .nth(0)
    .getByRole('button', { name: 'Move down' })
    .click()
  await expect(uploads.locator('li').nth(0)).toContainText('second-memory.png')

  await page.getByRole('link', { name: 'Preview Letter' }).click()
  await page.getByRole('button', { name: 'Begin reading' }).click()
  const gallery = page.getByRole('list', {
    name: 'A few favorite frames photos',
  })
  await expect(gallery.getByRole('img').nth(0)).toHaveAttribute(
    'aria-label',
    '1. second-memory.png',
  )
  await expect(gallery.getByRole('img').nth(1)).toHaveAttribute(
    'aria-label',
    '2. first-memory.png',
  )
  await expect(
    page.locator('[data-animation-token="sparkles"]'),
  ).toHaveAttribute('data-animation-trigger', 'on-open')

  await page.getByRole('link', { name: 'Back to editor' }).click()
  await page.goto('/creator')
  await createDraft(page, 'Another Year Brighter')
  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('Birthday wishes')
    .fill('I hope this year is kind to you.')
  await page.getByLabel('Voice note').setInputFiles({
    name: 'birthday-note.wav',
    mimeType: 'audio/wav',
    buffer: createWavBuffer(1),
  })
  await expect(
    page.getByRole('list', { name: 'Voice note uploads' }),
  ).toContainText('birthday-note.wav', { timeout: 10_000 })

  await page.getByRole('link', { name: 'Preview Letter' }).click()
  await page.getByRole('button', { name: 'Open your letter' }).click()
  const audio = page.locator('[data-element-id="voice-note"] audio')
  await expect(audio).toBeVisible()
  await expect(audio).toHaveAttribute('controls', '')
  await expect(audio).not.toHaveAttribute('autoplay')
})

test('only the owning Creator can open a Draft preview', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'preview-owner')
  const letterId = await createDraft(page, 'Our Story')

  const otherContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  try {
    const otherPage = await otherContext.newPage()
    await createVerifiedCreator(otherPage, request, 'preview-other')
    await otherPage.goto(`/creator/letters/${letterId}/preview`)
    await expect(otherPage.locator('p[role="alert"]')).toContainText(
      'This Draft is unavailable or you do not have permission to preview it.',
    )
  } finally {
    await otherContext.close()
  }
})
