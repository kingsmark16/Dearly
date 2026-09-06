import { describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { InMemoryCatalogRepository } from '../../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterDraftRecord } from '../../domain/letter.js'
import { CreateMediaUploadIntentUseCase } from './create-media-upload-intent.use-case.js'
import type { LetterOwnerReader } from '../../application/ports/letter-repository.js'
import type { MediaAssetIntentRepository } from './ports/media-asset-repository.js'
import type { PendingMediaAsset } from '../domain/media-asset.js'
import type { UploadIntentStorage } from './ports/object-storage.js'

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
    content: {},
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:00:00.000Z'),
  }
}

describe('CreateMediaUploadIntentUseCase', () => {
  it('creates a pending photo asset and a short-lived upload intent', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const createdAt = new Date('2026-09-06T00:01:00.000Z')
    const expiresAt = new Date('2026-09-06T00:16:00.000Z')
    let pendingAsset: PendingMediaAsset | undefined

    const letterRepository: LetterOwnerReader = {
      findByIdForCreator: vi.fn().mockResolvedValue(draft),
    }
    const mediaAssetRepository: MediaAssetIntentRepository = {
      countActiveByField: vi.fn().mockResolvedValue(1),
      createPending: vi.fn().mockImplementation(async (input) => {
        pendingAsset = {
          ...input,
          status: 'pending',
          createdAt,
          updatedAt: createdAt,
        }

        return pendingAsset
      }),
      deletePending: vi.fn(),
    }
    const objectStorage: UploadIntentStorage = {
      createUploadIntent: vi.fn().mockResolvedValue({
        uploadUrl: 'https://upload.example.test/signed-url',
        expiresAt,
      }),
    }
    const useCase = new CreateMediaUploadIntentUseCase(
      letterRepository,
      mediaAssetRepository,
      objectStorage,
    )

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      fieldId: 'sharedPhotos',
      fileName: 'first-memory.webp',
      contentType: 'image/webp',
      byteSize: 2_000_000,
    })

    expect(pendingAsset).toMatchObject({
      letterId: 'letter-1',
      fieldId: 'sharedPhotos',
      kind: 'photo',
      originalFileName: 'first-memory.webp',
      contentType: 'image/webp',
      byteSize: 2_000_000,
      status: 'pending',
    })
    expect(objectStorage.createUploadIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.stringMatching(/^letters\/letter-1\/media\//),
        contentType: 'image/webp',
      }),
    )
    expect(result).toMatchObject({
      uploadUrl: 'https://upload.example.test/signed-url',
      expiresAt,
      asset: {
        id: pendingAsset?.id,
        fieldId: 'sharedPhotos',
        kind: 'photo',
        status: 'pending',
      },
    })
  })

  it('uses the configured upload-intent lifetime', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const createUploadIntent = vi.fn().mockResolvedValue({
      uploadUrl: 'https://upload.example.test/signed-url',
      expiresAt: new Date('2026-09-06T00:31:00.000Z'),
    })
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      {
        countActiveByField: vi.fn().mockResolvedValue(0),
        createPending: vi.fn().mockResolvedValue({
          id: 'asset-1',
          letterId: 'letter-1',
          fieldId: 'sharedPhotos',
          kind: 'photo',
          status: 'pending',
          objectKey: 'letters/letter-1/media/asset-1',
          originalFileName: 'memory.webp',
          contentType: 'image/webp',
          byteSize: 2_000,
          expiresAt: new Date('2026-09-06T00:31:00.000Z'),
          createdAt: new Date('2026-09-06T00:01:00.000Z'),
          updatedAt: new Date('2026-09-06T00:01:00.000Z'),
        }),
        deletePending: vi.fn(),
      },
      { createUploadIntent },
      new ConfigService({ MEDIA_UPLOAD_INTENT_TTL_SECONDS: 1_800 }),
    )

    await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      fieldId: 'sharedPhotos',
      fileName: 'memory.webp',
      contentType: 'image/webp',
      byteSize: 2_000,
    })

    expect(createUploadIntent).toHaveBeenCalledWith(
      expect.objectContaining({ expiresInSeconds: 1_800 }),
    )
  })

  it('rejects an unsupported file type before creating an asset', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const createPending = vi.fn()
    const createUploadIntent = vi.fn()
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      {
        countActiveByField: vi.fn().mockResolvedValue(0),
        createPending,
        deletePending: vi.fn(),
      },
      { createUploadIntent },
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        fieldId: 'sharedPhotos',
        fileName: 'unsafe.svg',
        contentType: 'image/svg+xml',
        byteSize: 2_000,
      }),
    ).rejects.toThrow('Unsupported photo file type: image/svg+xml')
    expect(createPending).not.toHaveBeenCalled()
    expect(createUploadIntent).not.toHaveBeenCalled()
  })

  it('rejects a photo that exceeds the media size limit', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const createPending = vi.fn()
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      {
        countActiveByField: vi.fn().mockResolvedValue(0),
        createPending,
        deletePending: vi.fn(),
      },
      { createUploadIntent: vi.fn() },
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        fieldId: 'sharedPhotos',
        fileName: 'large-memory.webp',
        contentType: 'image/webp',
        byteSize: 26 * 1024 * 1024,
      }),
    ).rejects.toThrow('Shared photos must be 25 MB or smaller')
    expect(createPending).not.toHaveBeenCalled()
  })

  it('rejects a gallery upload at the Template photo limit', async () => {
    const draft = createDraft(await getTemplate('little-things'))
    const createPending = vi.fn()
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      {
        countActiveByField: vi.fn().mockResolvedValue(12),
        createPending,
        deletePending: vi.fn(),
      },
      { createUploadIntent: vi.fn() },
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        fieldId: 'sharedPhotos',
        fileName: 'thirteenth.webp',
        contentType: 'image/webp',
        byteSize: 2_000,
      }),
    ).rejects.toThrow('Shared photos allows at most 12 media assets')
    expect(createPending).not.toHaveBeenCalled()
  })

  it('rejects audio longer than the selected Template allows', async () => {
    const draft = createDraft(await getTemplate('another-year-brighter'))
    const createPending = vi.fn()
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(draft) },
      {
        countActiveByField: vi.fn().mockResolvedValue(0),
        createPending,
        deletePending: vi.fn(),
      },
      { createUploadIntent: vi.fn() },
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        fieldId: 'voiceNote',
        fileName: 'birthday-note.wav',
        contentType: 'audio/wav',
        byteSize: 2_000,
        durationSeconds: 181,
      }),
    ).rejects.toThrow('Voice note must be 180 seconds or shorter')
    expect(createPending).not.toHaveBeenCalled()
  })

  it('does not create an intent for another Creator’s Draft', async () => {
    const createPending = vi.fn()
    const createUploadIntent = vi.fn()
    const useCase = new CreateMediaUploadIntentUseCase(
      { findByIdForCreator: vi.fn().mockResolvedValue(undefined) },
      {
        countActiveByField: vi.fn(),
        createPending,
        deletePending: vi.fn(),
      },
      { createUploadIntent },
    )

    await expect(
      useCase.execute({
        creatorId: 'another-creator',
        letterId: 'letter-1',
        fieldId: 'sharedPhotos',
        fileName: 'private.webp',
        contentType: 'image/webp',
        byteSize: 2_000,
      }),
    ).rejects.toThrow('Letter Draft not found')
    expect(createPending).not.toHaveBeenCalled()
    expect(createUploadIntent).not.toHaveBeenCalled()
  })
})
