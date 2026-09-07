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

  it('lists both Birthday Letter templates with their distinct opening previews', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(repository.listTemplates('birthday-letter')).resolves.toEqual([
      expect.objectContaining({
        slug: 'make-a-wish',
        name: 'Make a Wish',
        category: {
          slug: 'birthday-letter',
          name: 'Birthday Letter',
        },
        preview: {
          eyebrow: 'Today is yours',
          title: 'Make a wish',
          subtitle:
            'A few words for the person who brings more light into the world.',
          ctaLabel: 'Open your birthday letter',
        },
      }),
      expect.objectContaining({
        slug: 'another-year-brighter',
        name: 'Another Year Brighter',
        category: {
          slug: 'birthday-letter',
          name: 'Birthday Letter',
        },
        preview: {
          eyebrow: 'A little celebration',
          title: 'You make life brighter',
          subtitle:
            'Press play when you are ready for a birthday wish in my voice.',
          ctaLabel: 'Open your letter',
        },
      }),
    ])
  })

  it('lists both Anniversary Letter templates with their distinct opening previews', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(
      repository.listTemplates('anniversary-letter'),
    ).resolves.toEqual([
      expect.objectContaining({
        slug: 'years-together',
        name: 'Years Together',
        category: {
          slug: 'anniversary-letter',
          name: 'Anniversary Letter',
        },
        preview: {
          eyebrow: 'Still us',
          title: 'Years together',
          subtitle:
            'The best parts of our story are the ones we are still writing.',
          ctaLabel: 'Open our story',
        },
      }),
      expect.objectContaining({
        slug: 'still-choosing-you',
        name: 'Still Choosing You',
        category: {
          slug: 'anniversary-letter',
          name: 'Anniversary Letter',
        },
        preview: {
          eyebrow: 'A promise worth repeating',
          title: 'Still choosing you',
          subtitle: 'Some promises grow more beautiful with time.',
          ctaLabel: 'Open your letter',
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

  it('exposes the complete Birthday template definitions for personalization', async () => {
    const repository = new InMemoryCatalogRepository()

    const makeAWish = await repository.findTemplateBySlug('make-a-wish')
    expect(makeAWish).toMatchObject({
      slug: 'make-a-wish',
      category: { slug: 'birthday-letter' },
      definition: {
        fields: [
          expect.objectContaining({
            id: 'recipientName',
            type: 'recipient-name',
            required: true,
          }),
          expect.objectContaining({
            id: 'birthdayMessage',
            type: 'rich-text',
            required: true,
            maxLength: 2_000,
          }),
          expect.objectContaining({
            id: 'birthdayPhotos',
            type: 'photo-gallery',
            required: false,
            minItems: 1,
            maxItems: 10,
          }),
        ],
        elements: [
          expect.objectContaining({
            id: 'birthday-message',
            type: 'text',
          }),
          expect.objectContaining({
            id: 'birthday-photos',
            type: 'photo-gallery',
          }),
          expect.objectContaining({
            id: 'confetti',
            type: 'animation',
            token: 'confetti',
            trigger: 'on-open',
          }),
        ],
        limits: {
          maxPhotosPerGallery: 10,
          maxAudioDurationSeconds: 180,
        },
      },
    })

    const anotherYearBrighter = await repository.findTemplateBySlug(
      'another-year-brighter',
    )
    expect(anotherYearBrighter).toMatchObject({
      slug: 'another-year-brighter',
      category: { slug: 'birthday-letter' },
      definition: {
        fields: [
          expect.objectContaining({
            id: 'recipientName',
            type: 'recipient-name',
            required: true,
          }),
          expect.objectContaining({
            id: 'birthdayWishes',
            type: 'rich-text',
            required: true,
            maxLength: 2_000,
          }),
          expect.objectContaining({
            id: 'voiceNote',
            type: 'audio',
            required: false,
            maxDurationSeconds: 180,
          }),
        ],
        elements: [
          expect.objectContaining({
            id: 'birthday-wishes',
            type: 'text',
          }),
          expect.objectContaining({
            id: 'voice-note',
            type: 'audio',
          }),
          expect.objectContaining({
            id: 'sparkles',
            type: 'animation',
            token: 'sparkles',
            trigger: 'on-scroll',
          }),
        ],
        limits: {
          maxPhotosPerGallery: 10,
          maxAudioDurationSeconds: 180,
        },
      },
    })
  })

  it('exposes the complete Anniversary template definitions for personalization', async () => {
    const repository = new InMemoryCatalogRepository()

    const yearsTogether = await repository.findTemplateBySlug('years-together')
    expect(yearsTogether).toMatchObject({
      slug: 'years-together',
      category: { slug: 'anniversary-letter' },
      definition: {
        fields: [
          expect.objectContaining({
            id: 'recipientName',
            type: 'recipient-name',
            required: true,
          }),
          expect.objectContaining({
            id: 'anniversaryMessage',
            type: 'rich-text',
            required: true,
            maxLength: 2_500,
          }),
          expect.objectContaining({
            id: 'chapters',
            type: 'photo-gallery',
            required: false,
            minItems: 3,
            maxItems: 15,
          }),
        ],
        elements: [
          expect.objectContaining({
            id: 'anniversary-message',
            type: 'text',
          }),
          expect.objectContaining({
            id: 'chapters',
            type: 'photo-gallery',
          }),
          expect.objectContaining({
            id: 'petals',
            type: 'animation',
            token: 'petals',
            trigger: 'on-scroll',
          }),
        ],
        limits: {
          maxPhotosPerGallery: 15,
          maxAudioDurationSeconds: 180,
        },
      },
    })

    const stillChoosingYou =
      await repository.findTemplateBySlug('still-choosing-you')
    expect(stillChoosingYou).toMatchObject({
      slug: 'still-choosing-you',
      category: { slug: 'anniversary-letter' },
      definition: {
        fields: [
          expect.objectContaining({
            id: 'recipientName',
            type: 'recipient-name',
            required: true,
          }),
          expect.objectContaining({
            id: 'promise',
            type: 'text',
            required: true,
            maxLength: 1_000,
          }),
          expect.objectContaining({
            id: 'privateNote',
            type: 'rich-text',
            required: true,
            maxLength: 2_000,
          }),
          expect.objectContaining({
            id: 'anniversaryAudio',
            type: 'audio',
            required: false,
            maxDurationSeconds: 180,
          }),
        ],
        elements: [
          expect.objectContaining({
            id: 'promise',
            type: 'text',
          }),
          expect.objectContaining({
            id: 'private-note',
            type: 'reveal',
          }),
          expect.objectContaining({
            id: 'anniversary-audio',
            type: 'audio',
          }),
        ],
        limits: {
          maxPhotosPerGallery: 10,
          maxAudioDurationSeconds: 180,
        },
      },
    })
  })

  it('returns no template for an unknown slug', async () => {
    const repository = new InMemoryCatalogRepository()

    await expect(
      repository.findTemplateBySlug('missing-template'),
    ).resolves.toBeUndefined()
  })
})
