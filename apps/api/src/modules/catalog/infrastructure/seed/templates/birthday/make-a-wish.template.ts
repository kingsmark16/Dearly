import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const makeAWishTemplate = {
  slug: 'make-a-wish',
  name: 'Make a Wish',
  description:
    'A bright, personal celebration for another trip around the sun.',
  categorySlug: 'birthday-letter',
  categoryName: 'Birthday Letter',
  version: 1,
  displayOrder: 1,
  definition: {
    openingScreen: {
      eyebrow: 'Today is yours',
      title: 'Make a wish',
      subtitle:
        'A few words for the person who brings more light into the world.',
      ctaLabel: 'Open your birthday letter',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'birthdayMessage',
        type: 'rich-text',
        label: 'Birthday message',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'birthdayPhotos',
        type: 'photo-gallery',
        label: 'Birthday photos',
        required: false,
        minItems: 1,
        maxItems: 10,
      },
    ],
    elements: [
      {
        id: 'birthday-message',
        type: 'text',
        heading: 'A whole year to celebrate',
        body: { kind: 'field', fieldId: 'birthdayMessage' },
      },
      {
        id: 'birthday-photos',
        type: 'photo-gallery',
        heading: 'The memories already made',
        fieldId: 'birthdayPhotos',
      },
      {
        id: 'confetti',
        type: 'animation',
        token: 'confetti',
        trigger: 'on-open',
      },
    ],
    limits: {
      maxPhotosPerGallery: 10,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
