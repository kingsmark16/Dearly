import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const anotherYearBrighterTemplate = {
  slug: 'another-year-brighter',
  name: 'Another Year Brighter',
  description:
    'A joyful message with room for wishes, memories, and a voice note.',
  categorySlug: 'birthday-letter',
  categoryName: 'Birthday Letter',
  version: 1,
  displayOrder: 2,
  definition: {
    openingScreen: {
      eyebrow: 'A little celebration',
      title: 'You make life brighter',
      subtitle:
        'Press play when you are ready for a birthday wish in my voice.',
      ctaLabel: 'Open your letter',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'birthdayWishes',
        type: 'rich-text',
        label: 'Birthday wishes',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'voiceNote',
        type: 'audio',
        label: 'Voice note',
        description: 'A short audio message for the birthday person.',
        required: false,
        maxDurationSeconds: 180,
      },
    ],
    elements: [
      {
        id: 'birthday-wishes',
        type: 'text',
        heading: 'My wish for you',
        body: { kind: 'field', fieldId: 'birthdayWishes' },
      },
      {
        id: 'voice-note',
        type: 'audio',
        label: 'A birthday note in my voice',
        fieldId: 'voiceNote',
      },
      {
        id: 'sparkles',
        type: 'animation',
        token: 'sparkles',
        trigger: 'on-scroll',
      },
    ],
    limits: {
      maxPhotosPerGallery: 10,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
