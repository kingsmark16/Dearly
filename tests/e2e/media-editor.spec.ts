import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'

const apiOrigin = process.env.DEARLY_E2E_API_URL ?? 'http://127.0.0.1:4000'
const webOrigin = process.env.DEARLY_E2E_WEB_URL ?? 'http://127.0.0.1:3100'
const password = 'CorrectHorseBatteryStaple!'
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

async function createVerifiedCreator(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`

  await page.goto('/sign-up')
  await page.getByLabel('Name').fill('Media Test Creator')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create Creator account' }).click()
  await expect(page.getByRole('status')).toContainText('Check your email')

  let verificationUrl = ''
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${apiOrigin}/api/v1/test/mail/verification?email=${encodeURIComponent(email)}`,
        )

        if (response.status() !== 200) {
          return ''
        }

        const body = (await response.json()) as {
          verificationUrl?: string
        }
        verificationUrl = body.verificationUrl ?? ''
        return verificationUrl
      },
      { timeout: 10_000 },
    )
    .toContain(`${apiOrigin}/api/auth/verify-email?`)

  await page.goto(verificationUrl)
  await expect(page).toHaveURL(/\/creator$/)
  await expect(
    page.getByRole('heading', { name: 'Choose a template' }),
  ).toBeVisible()

  return { email }
}

async function createDraft(page: Page, templateName: string) {
  await page
    .getByRole('button', { name: `Create draft with ${templateName}` })
    .click()
  await expect(page).toHaveURL(/\/creator\/letters\/[^/]+$/)
  await expect(
    page.getByRole('heading', { name: 'Edit your Letter Draft' }),
  ).toBeVisible()

  const url = new URL(page.url())
  return url.pathname.split('/').at(-1)!
}

test('Creator can upload, arrange, and validate a photo gallery', async ({
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'media-gallery')
  const letterId = await createDraft(page, 'The Little Things')

  await page.getByLabel('Recipient name').fill('Alex')
  await page
    .getByLabel('The little things')
    .fill('The first conversation we never wanted to end.')

  const gallery = page.getByRole('list', { name: 'Shared photos uploads' })
  const photoInput = page.getByLabel('Shared photos')

  await photoInput.setInputFiles([
    { name: 'first-memory.png', mimeType: 'image/png', buffer: onePixelPng },
    { name: 'second-memory.png', mimeType: 'image/png', buffer: onePixelPng },
  ])
  await expect(gallery.locator('li')).toHaveCount(2, { timeout: 10_000 })
  await expect(gallery.locator('li').nth(0)).toContainText('first-memory.png')
  await expect(gallery.locator('li').nth(1)).toContainText('second-memory.png')

  await gallery
    .locator('li')
    .nth(0)
    .getByRole('button', { name: 'Move down' })
    .click()
  await expect(gallery.locator('li').nth(0)).toContainText('second-memory.png')
  await expect(gallery.locator('li').nth(1)).toContainText('first-memory.png')

  await page.reload()
  const reloadedGallery = page.getByRole('list', {
    name: 'Shared photos uploads',
  })
  await expect(reloadedGallery.locator('li').nth(0)).toContainText(
    'second-memory.png',
  )
  await expect(reloadedGallery.locator('li').nth(1)).toContainText(
    'first-memory.png',
  )
  await expect(page.getByLabel('Recipient name')).toHaveValue('Alex')

  await page
    .locator('input[type="file"][aria-label="Shared photos"]')
    .setInputFiles({
      name: 'unsafe.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg></svg>'),
    })
  await expect(page.locator('p[role="alert"]')).toContainText(
    'Unsupported photo file type: image/svg+xml',
  )
})

test('Creator can upload an audio field after the browser reads its duration', async ({
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'media-audio')
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

  const uploads = page.getByRole('list', { name: 'Voice note uploads' })
  await expect(uploads).toContainText('birthday-note.wav', { timeout: 10_000 })
  await expect(page.locator('audio[controls]')).toBeVisible()
})

test('Creator media remains private to the owning Creator', async ({
  browser,
  page,
  request,
}) => {
  await createVerifiedCreator(page, request, 'media-owner')
  const letterId = await createDraft(page, 'The Little Things')
  await page.getByLabel('Shared photos').setInputFiles({
    name: 'private-memory.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  })
  await expect(
    page.getByRole('list', { name: 'Shared photos uploads' }),
  ).toContainText('private-memory.png', { timeout: 10_000 })

  const otherContext = await browser.newContext({ baseURL: webOrigin })

  try {
    const otherPage = await otherContext.newPage()
    await createVerifiedCreator(otherPage, request, 'media-other')
    await otherPage.goto(`/creator/letters/${letterId}`)
    await expect(otherPage.locator('p[role="alert"]')).toContainText(
      'This Draft is unavailable or you do not have permission to edit it.',
    )
  } finally {
    await otherContext.close()
  }
})
