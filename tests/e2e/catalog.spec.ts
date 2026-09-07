import { expect, test } from '@playwright/test'

test('anonymous Viewer can browse categories and templates', async ({
  page,
}) => {
  await page.goto('/templates')

  await expect(
    page.getByRole('heading', { name: 'Choose a Dearly template' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Love Letter' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Birthday Letter' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Anniversary Letter' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Our Story' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Make a Wish' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Years Together' }),
  ).toBeVisible()

  const loveLetterCategory = page.locator(
    'section[aria-labelledby="love-letter-heading"]',
  )
  await expect(loveLetterCategory).toContainText('2 templates')
  await expect(
    loveLetterCategory.locator('[data-template-preview="our-story"]'),
  ).toContainText('A little piece of us')
  await expect(
    loveLetterCategory.locator('[data-template-preview="our-story"]'),
  ).toContainText('Open letter')
  await expect(
    loveLetterCategory.locator('[data-template-preview="little-things"]'),
  ).toContainText('It is the little things')
  await expect(
    loveLetterCategory.locator('[data-template-preview="little-things"]'),
  ).toContainText('Begin reading')

  const birthdayCategory = page.locator(
    'section[aria-labelledby="birthday-letter-heading"]',
  )
  await expect(birthdayCategory).toContainText('2 templates')
  await expect(
    birthdayCategory.locator('[data-template-preview="make-a-wish"]'),
  ).toContainText('Make a wish')
  await expect(
    birthdayCategory.locator('[data-template-preview="make-a-wish"]'),
  ).toContainText('Open your birthday letter')
  await expect(
    birthdayCategory.locator('[data-template-preview="another-year-brighter"]'),
  ).toContainText('You make life brighter')
  await expect(
    birthdayCategory.locator('[data-template-preview="another-year-brighter"]'),
  ).toContainText('Open your letter')
})
