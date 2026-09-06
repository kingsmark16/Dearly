import { describe, expect, it, vi } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterPublishedRecord } from '../domain/letter.js'
import type { MediaAssetRecord } from '../media/domain/media-asset.js'
import type { MediaAssetReader } from '../media/application/ports/media-asset-repository.js'
import type {
  DownloadIntent,
  ObjectStorage,
} from '../media/application/ports/object-storage.js'
import type { PublishedLetterReader } from '../application/ports/letter-repository.js'
import { GetPublicLetterUseCase } from './get-public-letter.use-case.js'

async function getTemplate(slug: string) {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug(slug)

  if (!template) {
    throw new Error(`Test template is missing: ${slug}`)
  }

  return template
}

function createPublishedLetter(
  template: LetterPublishedRecord['template'],
  content: Record<string, unknown>,
  pendingContent: Record<string, unknown> | null = null,
): LetterPublishedRecord {
  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'Private creator title',
    status: 'published',
    template,
    content,
    pendingContent,
    shareToken: 'share-token-1',
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

function createReadyAsset(
  id: string,
  fieldId: string,
  kind: 'photo' | 'audio',
): MediaAssetRecord {
  return {
    id,
    letterId: 'letter-1',
    fieldId,
    kind,
    status: 'ready',
    objectKey: `private/letters/letter-1/${id}`,
    originalFileName: `${id}.${kind === 'photo' ? 'webp' : 'mp3'}`,
    contentType: kind === 'photo' ? 'image/webp' : 'audio/mpeg',
    byteSize: 2_000,
    ...(kind === 'audio' ? { durationSeconds: 30 } : {}),
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:00:00.000Z'),
  }
}

class FakePublishedLetterReader implements PublishedLetterReader {
  constructor(private readonly letter: LetterPublishedRecord | undefined) {}

  async findPublishedByShareToken(shareToken: string) {
    return this.letter?.shareToken === shareToken ? this.letter : undefined
  }
}

class FakeMediaReader implements MediaAssetReader {
  constructor(private readonly assets: MediaAssetRecord[]) {}

  async listForCreator() {
    return this.assets
  }
}

function createStorage() {
  const createDownloadIntent = vi
    .fn<ObjectStorage['createDownloadIntent']>()
    .mockImplementation(async ({ key }): Promise<DownloadIntent> => ({
      downloadUrl: `https://media.dearly.example/${key.split('/').at(-1)}`,
      expiresAt: new Date('2026-09-06T00:16:00.000Z'),
    }))

  const storage: ObjectStorage = {
    createUploadIntent: vi.fn(),
    headObject: vi.fn(),
    createDownloadIntent,
    deleteObject: vi.fn(),
    acceptUpload: vi.fn(),
  }

  return { storage, createDownloadIntent }
}

describe('GetPublicLetterUseCase', () => {
  it('returns the configured story and presigned media without private fields', async () => {
    const template = await getTemplate('little-things')
    const letter = createPublishedLetter(template, {
      recipientName: 'Alex',
      littleThings: 'All the small details I love about us.',
      sharedPhotos: ['photo-1', 'photo-2'],
    })
    const assets = [
      createReadyAsset('photo-1', 'sharedPhotos', 'photo'),
      createReadyAsset('photo-2', 'sharedPhotos', 'photo'),
    ]
    const { storage, createDownloadIntent } = createStorage()
    const useCase = new GetPublicLetterUseCase(
      new FakePublishedLetterReader(letter),
      new FakeMediaReader(assets),
      storage,
    )

    const result = await useCase.execute('share-token-1')

    expect(result).toMatchObject({
      slug: 'share-token-1',
      category: 'Love Letter',
      templateName: 'The Little Things',
    })
    expect(result?.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'photo-gallery',
          photos: [
            {
              id: 'photo-1',
              url: 'https://media.dearly.example/photo-1',
              alt: 'photo-1.webp',
            },
            {
              id: 'photo-2',
              url: 'https://media.dearly.example/photo-2',
              alt: 'photo-2.webp',
            },
          ],
        }),
      ]),
    )
    expect(result).not.toHaveProperty('title')
    expect(JSON.stringify(result)).not.toContain('private/letters')
    expect(createDownloadIntent).toHaveBeenCalledTimes(2)
  })

  it('returns text, reveal, audio, and animation elements for an audio Template', async () => {
    const template = await getTemplate('still-choosing-you')
    const letter = createPublishedLetter(template, {
      recipientName: 'Alex',
      promise: 'I will keep choosing you.',
      privateNote: 'Here is to every year ahead.',
      anniversaryAudio: 'audio-1',
    })
    const { storage } = createStorage()
    const useCase = new GetPublicLetterUseCase(
      new FakePublishedLetterReader(letter),
      new FakeMediaReader([
        createReadyAsset('audio-1', 'anniversaryAudio', 'audio'),
      ]),
      storage,
    )

    const result = await useCase.execute('share-token-1')

    expect(result?.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          body: 'I will keep choosing you.',
        }),
        expect.objectContaining({
          type: 'reveal',
          body: 'Here is to every year ahead.',
        }),
        expect.objectContaining({
          type: 'audio',
          label: 'A note for this anniversary',
          url: 'https://media.dearly.example/audio-1',
        }),
      ]),
    )
  })

  it('keeps a Pending revision hidden from Viewers', async () => {
    const template = await getTemplate('our-story')
    const { storage } = createStorage()
    const useCase = new GetPublicLetterUseCase(
      new FakePublishedLetterReader(
        createPublishedLetter(
          template,
          {
            recipientName: 'Alex',
            favoriteMemory: 'The old published memory.',
          },
          {
            recipientName: 'Alex',
            favoriteMemory: 'The new pending memory.',
          },
        ),
      ),
      new FakeMediaReader([]),
      storage,
    )

    const result = await useCase.execute('share-token-1')

    expect(result?.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          body: 'The old published memory.',
        }),
      ]),
    )
    expect(JSON.stringify(result)).not.toContain('The new pending memory.')
  })

  it('does not reveal a Draft or a Letter with the wrong share token', async () => {
    const { storage, createDownloadIntent } = createStorage()
    const useCase = new GetPublicLetterUseCase(
      new FakePublishedLetterReader(undefined),
      new FakeMediaReader([]),
      storage,
    )

    await expect(useCase.execute('not-the-token')).resolves.toBeUndefined()
    expect(createDownloadIntent).not.toHaveBeenCalled()
  })
})
