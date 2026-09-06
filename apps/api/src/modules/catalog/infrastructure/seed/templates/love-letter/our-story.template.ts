import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const ourStoryTemplate = {
  slug: 'our-story',
  name: 'Our Story',
  description:
    'A gentle scroll through the moments that made your story yours.',
  categorySlug: 'love-letter',
  categoryName: 'Love Letter',
  version: 1,
  displayOrder: 1,
  definition: {
    openingScreen: {
      eyebrow: 'A letter for you',
      title: 'A little piece of us',
      subtitle:
        'Take a slow scroll through the moments I never want to forget.',
      ctaLabel: 'Open letter',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'favoriteMemory',
        type: 'rich-text',
        label: 'Favorite memory',
        description: 'Describe a moment you want to keep close.',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'secretPromise',
        type: 'text',
        label: 'Secret promise',
        description: 'An optional message revealed with a tap.',
        required: false,
        maxLength: 800,
      },
    ],
    elements: [
      {
        id: 'favorite-memory',
        type: 'text',
        heading: 'The moments I keep',
        body: { kind: 'field', fieldId: 'favoriteMemory' },
      },
      {
        id: 'secret-promise',
        type: 'reveal',
        heading: 'A small promise',
        prompt: 'Tap to reveal',
        body: { kind: 'field', fieldId: 'secretPromise' },
      },
      {
        id: 'hearts',
        type: 'animation',
        token: 'hearts',
        trigger: 'on-scroll',
      },
    ],
    limits: {
      maxPhotosPerGallery: 12,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
