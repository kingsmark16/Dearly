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

async function openShareLinkAsViewer(
  browser: import('@playwright/test').Browser,
  shareUrl: string,
) {
  const viewerContext = await browser.newContext({
    baseURL: process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100',
  })

  const viewerPage = await viewerContext.newPage()
  await viewerPage.goto(shareUrl)

  return { viewerContext, viewerPage }
}

test('Creator can publish Make a Wish and an anonymous Viewer can experience it', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'birthday-make-a-wish')
  await createDraft(page, 'Make a Wish')

  await page.getByLabel('Recipient name').fill('Maya')
  await page
    .getByLabel('Birthday message')
    .fill('May this year bring you more gentle surprises than you can count.')
  await page.getByLabel('Birthday photos').setInputFiles({
    name: 'birthday-memory.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  })
  await expect(
    page.getByRole('list', { name: 'Birthday photos uploads' }),
  ).toContainText('birthday-memory.png', { timeout: 10_000 })
  await waitForDraftSave(page)

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const shareUrl = await page
    .getByRole('textbox', { name: 'Letter Share link' })
    .inputValue()

  const { viewerContext, viewerPage } = await openShareLinkAsViewer(
    browser,
    shareUrl,
  )

  try {
    await expect(
      viewerPage.getByRole('heading', { name: 'Make a wish' }),
    ).toBeVisible()
    await viewerPage
      .getByRole('button', { name: 'Open your birthday letter' })
      .click()
    await expect(
      viewerPage.getByRole('heading', { name: 'A whole year to celebrate' }),
    ).toBeVisible()
    await expect(viewerPage.getByRole('main')).toContainText(
      'May this year bring you more gentle surprises than you can count.',
    )
    await expect(
      viewerPage.getByRole('list', {
        name: 'The memories already made photos',
      }),
    ).toHaveCount(1)
    await expect(
      viewerPage.locator('[data-animation-token="confetti"]'),
    ).toHaveAttribute('data-animation-trigger', 'on-open')
  } finally {
    await viewerContext.close()
  }
})

test('Creator can publish Another Year Brighter and an anonymous Viewer can experience it', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'birthday-another-year')
  await createDraft(page, 'Another Year Brighter')

  await page.getByLabel('Recipient name').fill('Maya')
  await page
    .getByLabel('Birthday wishes')
    .fill('I hope this next chapter gives you plenty of reasons to feel proud.')
  await page.getByLabel('Voice note').setInputFiles({
    name: 'birthday-wish.wav',
    mimeType: 'audio/wav',
    buffer: createWavBuffer(1),
  })
  await expect(
    page.getByRole('list', { name: 'Voice note uploads' }),
  ).toContainText('birthday-wish.wav', { timeout: 10_000 })
  await waitForDraftSave(page)

  await page.getByRole('button', { name: 'Publish Letter' }).click()
  const shareUrl = await page
    .getByRole('textbox', { name: 'Letter Share link' })
    .inputValue()

  const { viewerContext, viewerPage } = await openShareLinkAsViewer(
    browser,
    shareUrl,
  )

  try {
    await expect(
      viewerPage.getByRole('heading', { name: 'You make life brighter' }),
    ).toBeVisible()
    await viewerPage.getByRole('button', { name: 'Open your letter' }).click()
    await expect(
      viewerPage.getByRole('heading', { name: 'My wish for you' }),
    ).toBeVisible()
    await expect(viewerPage.getByRole('main')).toContainText(
      'I hope this next chapter gives you plenty of reasons to feel proud.',
    )
    await expect(
      viewerPage.locator('[data-element-id="voice-note"] audio'),
    ).toHaveAttribute('controls', '')
    await expect(
      viewerPage.locator('[data-animation-token="sparkles"]'),
    ).toHaveAttribute('data-animation-trigger', 'on-scroll')
  } finally {
    await viewerContext.close()
  }
})
