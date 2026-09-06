import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const littleThingsTemplate = {
  slug: 'little-things',
  name: 'The Little Things',
  description: 'A photo-forward thank-you for the small details you adore.',
  categorySlug: 'love-letter',
  categoryName: 'Love Letter',
  version: 1,
  displayOrder: 2,
  definition: {
    openingScreen: {
      eyebrow: 'For my favorite person',
      title: 'It is the little things',
      subtitle: 'The quiet details are often the ones I love the most.',
      ctaLabel: 'Begin reading',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'littleThings',
        type: 'rich-text',
        label: 'The little things',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'sharedPhotos',
        type: 'photo-gallery',
        label: 'Shared photos',
        description: 'Choose a few moments to place beside your words.',
        required: false,
        minItems: 2,
        maxItems: 12,
      },
    ],
    elements: [
      {
        id: 'little-things',
        type: 'text',
        heading: 'The details I notice',
        body: { kind: 'field', fieldId: 'littleThings' },
      },
      {
        id: 'shared-photos',
        type: 'photo-gallery',
        heading: 'A few favorite frames',
        fieldId: 'sharedPhotos',
      },
      {
        id: 'sparkles',
        type: 'animation',
        token: 'sparkles',
        trigger: 'on-open',
      },
    ],
    limits: {
      maxPhotosPerGallery: 12,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
