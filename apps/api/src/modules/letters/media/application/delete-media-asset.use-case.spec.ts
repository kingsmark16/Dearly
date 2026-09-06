import { describe, expect, it, vi } from 'vitest'
import { InMemoryCatalogRepository } from '../../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterPublishedRecord } from '../../domain/letter.js'
import type { MediaAssetRecord } from '../domain/media-asset.js'
import { DeleteMediaAssetUseCase } from './delete-media-asset.use-case.js'
import type { LetterOwnerReader } from '../../application/ports/letter-repository.js'
import type { MediaAssetRepository } from './ports/media-asset-repository.js'
import type { ObjectStorage } from './ports/object-storage.js'

async function getPublishedLetter(): Promise<LetterPublishedRecord> {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug('little-things')

  if (!template) {
    throw new Error('Test template is missing')
  }

  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'The little things',
    status: 'published',
    template,
    content: {
      recipientName: 'Alex',
      littleThings: 'The old live memory.',
      sharedPhotos: ['photo-1'],
    },
    pendingContent: {
      recipientName: 'Alex',
      littleThings: 'The old live memory.',
      sharedPhotos: ['photo-1'],
    },
    shareToken: 'stable-share-token',
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

function createPhoto(): MediaAssetRecord {
  return {
    id: 'photo-1',
    letterId: 'letter-1',
    fieldId: 'sharedPhotos',
    kind: 'photo',
    status: 'ready',
    objectKey: 'letters/letter-1/media/photo-1',
    originalFileName: 'memory.webp',
    contentType: 'image/webp',
    byteSize: 2_000,
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:00:00.000Z'),
  }
}

function createMediaRepository(asset: MediaAssetRecord) {
  return {
    countActiveByField: vi.fn(),
    createPending: vi.fn(),
    deletePending: vi.fn(),
    findForCreator: vi.fn().mockResolvedValue(asset),
    listForCreator: vi.fn(),
    completeAndAttach: vi.fn(),
    deleteAndDetach: vi.fn().mockResolvedValue(asset),
    reorderAndSave: vi.fn(),
  } satisfies MediaAssetRepository
}

function createStorage() {
  return {
    createUploadIntent: vi.fn(),
    headObject: vi.fn(),
    createDownloadIntent: vi.fn(),
    deleteObject: vi.fn(),
    acceptUpload: vi.fn(),
  } satisfies ObjectStorage
}

describe('DeleteMediaAssetUseCase', () => {
  it('keeps a live asset when removing it from a Published Letter revision', async () => {
    const letter = await getPublishedLetter()
    const asset = createPhoto()
    const letterReader: LetterOwnerReader = {
      findByIdForCreator: vi.fn().mockResolvedValue(letter),
    }
    const mediaRepository = createMediaRepository(asset)
    const storage = createStorage()
    const useCase = new DeleteMediaAssetUseCase(
      letterReader,
      mediaRepository,
      storage,
    )

    await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      assetId: 'photo-1',
    })

    expect(mediaRepository.deleteAndDetach).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      assetId: 'photo-1',
      content: {
        recipientName: 'Alex',
        littleThings: 'The old live memory.',
      },
    })
    expect(storage.deleteObject).not.toHaveBeenCalled()
  })
})
