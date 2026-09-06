import { describe, expect, it } from 'vitest'
import type { Template } from '@dearly/contracts/catalog/template-response'
import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import { createLetterStoryModel } from './letter-story-model'

const template = {
  slug: 'test-story',
  name: 'Test Story',
  description: 'A template used by the preview model tests.',
  category: { slug: 'love-letter', name: 'Love Letter' },
  version: 1,
  displayOrder: 1,
  definition: {
    openingScreen: {
      eyebrow: 'A note for you',
      title: 'The opening title',
      subtitle: 'The opening subtitle.',
      ctaLabel: 'Open this letter',
    },
    fields: [
      {
        id: 'recipientName',
        type: 'recipient-name',
        label: 'Recipient name',
        required: true,
      },
      {
        id: 'story',
        type: 'rich-text',
        label: 'Story',
        required: true,
        maxLength: 2_000,
      },
      {
        id: 'secret',
        type: 'text',
        label: 'Secret',
        required: false,
        maxLength: 500,
      },
    ],
    elements: [
      {
        id: 'story-element',
        type: 'text',
        heading: 'The story',
        body: { kind: 'field', fieldId: 'story' },
      },
      {
        id: 'secret-element',
        type: 'reveal',
        heading: 'A secret',
        prompt: 'Tap to reveal',
        body: { kind: 'field', fieldId: 'secret' },
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
} satisfies Template

describe('createLetterStoryModel', () => {
  it('uses the Template opening and text while hiding an empty optional reveal', () => {
    const model = createLetterStoryModel({
      template,
      content: {
        recipientName: 'Alex',
        story: 'The first line.\nThe second line.',
      },
      mediaAssets: [],
    })

    expect(model.opening).toEqual(template.definition.openingScreen)
    expect(model.elements).toEqual([
      {
        id: 'story-element',
        type: 'text',
        heading: 'The story',
        body: 'The first line.\nThe second line.',
      },
      {
        id: 'sparkles',
        type: 'animation',
        token: 'sparkles',
        trigger: 'on-open',
      },
    ])
    expect(model.requiredFields).toEqual([])
  })

  it('keeps missing required fields visible as publish blockers', () => {
    const model = createLetterStoryModel({
      template,
      content: {},
      mediaAssets: [],
    })

    expect(model.requiredFields).toEqual([
      {
        fieldId: 'recipientName',
        fieldLabel: 'Recipient name',
        message: 'Recipient name is required before publishing.',
      },
      {
        fieldId: 'story',
        fieldLabel: 'Story',
        message: 'Story is required before publishing.',
      },
    ])
    expect(model.elements).toEqual([
      {
        id: 'story-element',
        type: 'required-blocker',
        heading: 'The story',
        fieldId: 'story',
        fieldLabel: 'Story',
        message: 'Story is required before publishing.',
      },
      {
        id: 'sparkles',
        type: 'animation',
        token: 'sparkles',
        trigger: 'on-open',
      },
    ])
  })

  it('resolves media fields in the order stored by the Creator', () => {
    const mediaTemplate = {
      ...template,
      definition: {
        ...template.definition,
        fields: [
          template.definition.fields[0],
          {
            id: 'photos',
            type: 'photo-gallery',
            label: 'Photos',
            required: false,
            minItems: 2,
            maxItems: 12,
          },
          {
            id: 'voice',
            type: 'audio',
            label: 'Voice',
            required: false,
            maxDurationSeconds: 180,
          },
        ],
        elements: [
          {
            id: 'photos-element',
            type: 'photo-gallery',
            heading: 'Our photos',
            fieldId: 'photos',
          },
          {
            id: 'voice-element',
            type: 'audio',
            label: 'A note in my voice',
            fieldId: 'voice',
          },
        ],
      },
    } satisfies Template

    const asset = (
      id: string,
      fieldId: string,
      kind: CreatorMediaAsset['kind'],
    ): CreatorMediaAsset => ({
      id,
      fieldId,
      kind,
      status: 'ready',
      originalFileName: `${id}.file`,
      contentType: kind === 'audio' ? 'audio/wav' : 'image/png',
      byteSize: 1,
      ...(kind === 'audio' ? { durationSeconds: 1 } : {}),
      previewUrl: `https://media.example.test/${id}`,
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:00:00.000Z',
    })

    const model = createLetterStoryModel({
      template: mediaTemplate,
      content: {
        recipientName: 'Alex',
        photos: ['photo-2', 'photo-1'],
        voice: 'audio-1',
      },
      mediaAssets: [
        asset('photo-1', 'photos', 'photo'),
        asset('audio-1', 'voice', 'audio'),
        asset('photo-2', 'photos', 'photo'),
      ],
    })

    expect(model.elements).toEqual([
      {
        id: 'photos-element',
        type: 'photo-gallery',
        heading: 'Our photos',
        assets: [
          asset('photo-2', 'photos', 'photo'),
          asset('photo-1', 'photos', 'photo'),
        ],
      },
      {
        id: 'voice-element',
        type: 'audio',
        label: 'A note in my voice',
        asset: asset('audio-1', 'voice', 'audio'),
      },
    ])
  })
})
