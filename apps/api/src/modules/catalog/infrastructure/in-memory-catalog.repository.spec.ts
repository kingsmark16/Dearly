import { describe, expect, it } from 'vitest'
import { CatalogCategoryNotFoundError } from '../domain/category.js'
import { InMemoryCatalogRepository } from './in-memory-catalog.repository.js'

describe('InMemoryCatalogRepository', () => {
  it('lists the curated categories with their template counts', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(repository.listCategories()).resolves.toEqual([
      expect.objectContaining({
        slug: 'love-letter',
        name: 'Love Letter',
        templateCount: 2,
      }),
      expect.objectContaining({
        slug: 'birthday-letter',
        name: 'Birthday Letter',
        templateCount: 2,
      }),
      expect.objectContaining({
        slug: 'anniversary-letter',
        name: 'Anniversary Letter',
        templateCount: 2,
      }),
    ])
  })

  it('lists summaries without exposing the full template definition', async () => {
    const repository = new InMemoryCatalogRepository()
    const templates = await repository.listTemplates()

    expect(templates).toHaveLength(6)
    expect(templates[0]).toMatchObject({
      slug: 'our-story',
      name: 'Our Story',
      category: { slug: 'love-letter' },
      version: 1,
    })
    expect(templates[0]).not.toHaveProperty('definition')
  })

  it('filters templates by category', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(repository.listTemplates('love-letter')).resolves.toEqual([
      expect.objectContaining({
        slug: 'our-story',
        preview: {
          eyebrow: 'A letter for you',
          title: 'A little piece of us',
          subtitle:
            'Take a slow scroll through the moments I never want to forget.',
          ctaLabel: 'Open letter',
        },
      }),
      expect.objectContaining({
        slug: 'little-things',
        preview: {
          eyebrow: 'For my favorite person',
          title: 'It is the little things',
          subtitle: 'The quiet details are often the ones I love the most.',
          ctaLabel: 'Begin reading',
        },
      }),
    ])
  })

  it('rejects an unknown category filter', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(
      repository.listTemplates('missing-category'),
    ).rejects.toBeInstanceOf(CatalogCategoryNotFoundError)
  })

  it('returns the versioned definition for one template', async () => {
    const repository = new InMemoryCatalogRepository()
    const template = await repository.findTemplateBySlug('our-story')

    expect(template).toMatchObject({
      slug: 'our-story',
      version: 1,
      category: { name: 'Love Letter' },
      preview: {
        title: 'A little piece of us',
      },
      definition: {
        openingScreen: { title: 'A little piece of us' },
      },
    })
    expect(template?.definition.fields.length).toBeGreaterThan(0)
    expect(template?.definition.elements.length).toBeGreaterThan(0)
  })

  it('returns no template for an unknown slug', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(
      repository.findTemplateBySlug('missing-template'),
    ).resolves.toBeUndefined()
  })
})
