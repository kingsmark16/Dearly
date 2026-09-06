import type { CatalogTemplateSeed } from '../../../../domain/template.js'

export const stillChoosingYouTemplate = {
  slug: 'still-choosing-you',
  name: 'Still Choosing You',
  description:
    'An intimate promise with space for a reveal and a quiet audio note.',
  categorySlug: 'anniversary-letter',
  categoryName: 'Anniversary Letter',
  version: 1,
  displayOrder: 2,
  definition: {
    openingScreen: {
      eyebrow: 'A promise worth repeating',
      title: 'Still choosing you',
      subtitle: 'Some promises grow more beautiful with time.',
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
        id: 'promise',
        type: 'text',
        label: 'The promise',
        required: true,
        maxLength: 1_000,
      },
      {
        id: 'privateNote',
        type: 'rich-text',
        label: 'Private note',
        description: 'A longer message revealed after the promise.',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'anniversaryAudio',
        type: 'audio',
        label: 'Anniversary audio',
        required: false,
        maxDurationSeconds: 180,
      },
    ],
    elements: [
      {
        id: 'promise',
        type: 'text',
        heading: 'The promise I keep',
        body: { kind: 'field', fieldId: 'promise' },
      },
      {
        id: 'private-note',
        type: 'reveal',
        heading: 'One more thing',
        prompt: 'Tap to read the rest',
        body: { kind: 'field', fieldId: 'privateNote' },
      },
      {
        id: 'anniversary-audio',
        type: 'audio',
        label: 'A note for this anniversary',
        fieldId: 'anniversaryAudio',
      },
    ],
    limits: {
      maxPhotosPerGallery: 10,
      maxAudioDurationSeconds: 180,
    },
  },
} satisfies CatalogTemplateSeed
