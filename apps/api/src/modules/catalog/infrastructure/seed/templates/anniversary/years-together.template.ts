import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const yearsTogetherTemplate = {
  slug: 'years-together',
  name: 'Years Together',
  description:
    'A timeless walk through the chapters you have written side by side.',
  categorySlug: 'anniversary-letter',
  categoryName: 'Anniversary Letter',
  version: 1,
  displayOrder: 1,
  definition: {
    openingScreen: {
      eyebrow: 'Still us',
      title: 'Years together',
      subtitle:
        'The best parts of our story are the ones we are still writing.',
      ctaLabel: 'Open our story',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'anniversaryMessage',
        type: 'rich-text',
        label: 'Anniversary message',
        required: true,
        maxLength: 2_500,
      },
      {
        id: 'chapters',
        type: 'photo-gallery',
        label: 'Chapters in photos',
        required: false,
        minItems: 3,
        maxItems: 15,
      },
    ],
    elements: [
      {
        id: 'anniversary-message',
        type: 'text',
        heading: 'Everything we have made',
        body: { kind: 'field', fieldId: 'anniversaryMessage' },
      },
      {
        id: 'chapters',
        type: 'photo-gallery',
        heading: 'A few chapters',
        fieldId: 'chapters',
      },
      {
        id: 'petals',
        type: 'animation',
        token: 'petals',
        trigger: 'on-scroll',
      },
    ],
    limits: {
      maxPhotosPerGallery: 15,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
