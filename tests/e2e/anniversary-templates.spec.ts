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

test('Creator can publish Years Together and an anonymous Viewer can experience it', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'anniversary-years-together')
  await createDraft(page, 'Years Together')

  await page.getByLabel('Recipient name').fill('Maya')
  await page
    .getByLabel('Anniversary message')
    .fill('I love the life we keep making, one ordinary day at a time.')
  await page.getByLabel('Chapters in photos').setInputFiles([
    { name: 'chapter-one.png', mimeType: 'image/png', buffer: onePixelPng },
    { name: 'chapter-two.png', mimeType: 'image/png', buffer: onePixelPng },
    {
      name: 'chapter-three.png',
      mimeType: 'image/png',
      buffer: onePixelPng,
    },
  ])
  await expect(
    page.getByRole('list', { name: 'Chapters in photos uploads' }),
  ).toContainText('chapter-three.png', { timeout: 10_000 })
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
      viewerPage.getByRole('heading', { name: 'Years together' }),
    ).toBeVisible()
    await viewerPage.getByRole('button', { name: 'Open our story' }).click()
    await expect(
      viewerPage.getByRole('heading', { name: 'Everything we have made' }),
    ).toBeVisible()
    await expect(viewerPage.getByRole('main')).toContainText(
      'I love the life we keep making, one ordinary day at a time.',
    )
    await expect(
      viewerPage.getByRole('list', { name: 'A few chapters photos' }),
    ).toHaveCount(1)
    await expect(
      viewerPage
        .getByRole('list', { name: 'A few chapters photos' })
        .getByRole('img'),
    ).toHaveCount(3)
    await expect(
      viewerPage.locator('[data-animation-token="petals"]'),
    ).toHaveAttribute('data-animation-trigger', 'on-scroll')
  } finally {
    await viewerContext.close()
  }
})

test('Creator can publish Still Choosing You and an anonymous Viewer can experience it', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'anniversary-still-choosing')
  await createDraft(page, 'Still Choosing You')

  await page.getByLabel('Recipient name').fill('Maya')
  await page
    .getByRole('textbox', { name: /^The promise/ })
    .fill('I will keep choosing you in every season we meet.')
  await page
    .getByLabel('Private note')
    .fill('And I will keep finding new reasons to be grateful for our life.')
  await page.getByLabel('Anniversary audio').setInputFiles({
    name: 'anniversary-note.wav',
    mimeType: 'audio/wav',
    buffer: createWavBuffer(1),
  })
  await expect(
    page.getByRole('list', { name: 'Anniversary audio uploads' }),
  ).toContainText('anniversary-note.wav', { timeout: 10_000 })
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
      viewerPage.getByRole('heading', { name: 'Still choosing you' }),
    ).toBeVisible()
    await viewerPage.getByRole('button', { name: 'Open your letter' }).click()
    await expect(
      viewerPage.getByRole('heading', { name: 'The promise I keep' }),
    ).toBeVisible()
    await expect(viewerPage.getByRole('main')).toContainText(
      'I will keep choosing you in every season we meet.',
    )
    await viewerPage
      .getByRole('button', { name: 'Tap to read the rest' })
      .click()
    await expect(viewerPage.getByRole('main')).toContainText(
      'And I will keep finding new reasons to be grateful for our life.',
    )
    await expect(
      viewerPage.locator('[data-element-id="anniversary-audio"] audio'),
    ).toHaveAttribute('controls', '')
  } finally {
    await viewerContext.close()
  }
})
