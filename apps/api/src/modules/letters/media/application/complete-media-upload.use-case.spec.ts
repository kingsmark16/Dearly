import { describe, expect, it, vi } from 'vitest'
import { InMemoryCatalogRepository } from '../../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterDraftRecord } from '../../domain/letter.js'
import type {
  MediaAssetRecord,
  PendingMediaAsset,
} from '../domain/media-asset.js'
import { CompleteMediaUploadUseCase } from './complete-media-upload.use-case.js'
import type { MediaAssetRepository } from './ports/media-asset-repository.js'
import type { ObjectStorage } from './ports/object-storage.js'

async function getTemplate(slug: string) {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug(slug)

  if (!template) {
    throw new Error('Test template is missing')
  }

  return template
}

function createDraft(
  template: LetterDraftRecord['template'],
): LetterDraftRecord {
  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'Our story',
    status: 'draft',
    template,
    content: { favoriteMemory: 'A memory already saved.' },
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:00:00.000Z'),
  }
}

function createPendingAsset(): PendingMediaAsset {
  return {
    id: 'asset-1',
    letterId: 'letter-1',
    fieldId: 'sharedPhotos',
    kind: 'photo',
    status: 'pending',
    objectKey: 'letters/letter-1/media/asset-1',
    originalFileName: 'memory.webp',
    contentType: 'image/webp',
    byteSize: 2_000,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date('2026-09-06T00:01:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

class FakeMediaAssetRepository implements MediaAssetRepository {
  readonly pendingAsset = createPendingAsset()
  readonly completeAndAttach =
    vi.fn<MediaAssetRepository['completeAndAttach']>()

  countActiveByField = vi.fn<MediaAssetRepository['countActiveByField']>()
  createPending = vi.fn<MediaAssetRepository['createPending']>()
  deletePending = vi.fn<MediaAssetRepository['deletePending']>()
  listForCreator = vi.fn<MediaAssetRepository['listForCreator']>()
  deleteAndDetach = vi.fn<MediaAssetRepository['deleteAndDetach']>()
  reorderAndSave = vi.fn<MediaAssetRepository['reorderAndSave']>()

  findForCreator = vi
    .fn<MediaAssetRepository['findForCreator']>()
    .mockResolvedValue(this.pendingAsset)
}

function createStorage(overrides: Partial<ObjectStorage> = {}): ObjectStorage {
  return {
    createUploadIntent: vi.fn(),
    headObject: vi.fn().mockResolvedValue({
      key: 'letters/letter-1/media/asset-1',
      contentType: 'image/webp',
      byteSize: 2_000,
    }),
    createDownloadIntent: vi.fn(),
    deleteObject: vi.fn(),
    acceptUpload: vi.fn(),
    ...overrides,
  }
}

describe('CompleteMediaUploadUseCase', () => {
  it('verifies the stored object and attaches it to the Draft content', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const repository = new FakeMediaAssetRepository()
    const completedAsset: MediaAssetRecord = {
      ...repository.pendingAsset,
      status: 'ready',
    }
    repository.completeAndAttach.mockResolvedValue(completedAsset)
    const useCase = new CompleteMediaUploadUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      repository,
      createStorage(),
    )

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      assetId: 'asset-1',
    })

    expect(repository.completeAndAttach).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      assetId: 'asset-1',
      content: {
        favoriteMemory: 'A memory already saved.',
        sharedPhotos: ['asset-1'],
      },
    })
    expect(result).toEqual(completedAsset)
  })

  it('does not attach an asset when the storage object is missing', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const repository = new FakeMediaAssetRepository()
    const completeAndAttach = repository.completeAndAttach
    const useCase = new CompleteMediaUploadUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      repository,
      createStorage({ headObject: vi.fn().mockResolvedValue(undefined) }),
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        assetId: 'asset-1',
      }),
    ).rejects.toThrow('Media upload is not complete')
    expect(completeAndAttach).not.toHaveBeenCalled()
  })

  it('deletes a mismatched object instead of attaching it', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const repository = new FakeMediaAssetRepository()
    const storage = createStorage({
      headObject: vi.fn().mockResolvedValue({
        key: 'letters/letter-1/media/asset-1',
        contentType: 'image/png',
        byteSize: 2_000,
      }),
    })
    const useCase = new CompleteMediaUploadUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      repository,
      storage,
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        assetId: 'asset-1',
      }),
    ).rejects.toThrow('Uploaded media did not match')
    expect(storage.deleteObject).toHaveBeenCalledWith(
      repository.pendingAsset.objectKey,
    )
    expect(repository.completeAndAttach).not.toHaveBeenCalled()
  })
})
