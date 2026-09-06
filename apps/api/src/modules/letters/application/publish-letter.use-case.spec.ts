import { describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { MediaAssetRecord } from '../media/domain/media-asset.js'
import type { MediaAssetReader } from '../media/application/ports/media-asset-repository.js'
import {
  LetterPublishValidationError,
  type LetterPublishedRecord,
  type LetterDraftRecord,
} from '../domain/letter.js'
import type { LetterPublishingRepository } from './ports/letter-repository.js'
import { PublishLetterUseCase } from './publish-letter.use-case.js'

async function getTemplate(slug: string) {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug(slug)

  if (!template) {
    throw new Error(`Test template is missing: ${slug}`)
  }

  return template
}

function createDraft(
  template: LetterDraftRecord['template'],
  content: Record<string, unknown>,
): LetterDraftRecord {
  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'The day we met',
    status: 'draft',
    template,
    content,
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:00:00.000Z'),
  }
}

function createPublishedRecord(
  draft: LetterDraftRecord,
  shareToken: string,
): LetterPublishedRecord {
  return {
    ...draft,
    status: 'published',
    shareToken,
  }
}

class FakeLetterPublishingRepository implements LetterPublishingRepository {
  readonly publishDraft = vi
    .fn<LetterPublishingRepository['publishDraft']>()
    .mockImplementation(async ({ shareToken }) => {
      if (!this.draft) {
        return undefined
      }

      return createPublishedRecord(this.draft, shareToken)
    })

  constructor(readonly draft: LetterDraftRecord | undefined) {}

  async findDraftById(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord | undefined> {
    return this.draft?.creatorId === creatorId && this.draft.id === letterId
      ? this.draft
      : undefined
  }
}

class FakeMediaReader implements MediaAssetReader {
  constructor(private readonly assets: MediaAssetRecord[] = []) {}

  async listForCreator(
    creatorId: string,
    letterId: string,
  ): Promise<MediaAssetRecord[]> {
    void creatorId
    return this.assets.filter((asset) => asset.letterId === letterId)
  }
}

function createReadyPhoto(id: string, fieldId: string): MediaAssetRecord {
  return {
    id,
    letterId: 'letter-1',
    fieldId,
    kind: 'photo',
    status: 'ready',
    objectKey: `letters/letter-1/media/${id}`,
    originalFileName: `${id}.webp`,
    contentType: 'image/webp',
    byteSize: 2_000,
    createdAt: new Date('2026-09-06T00:01:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

function createUseCase(
  repository: LetterPublishingRepository,
  mediaReader: MediaAssetReader = new FakeMediaReader(),
) {
  return new PublishLetterUseCase(
    repository,
    mediaReader,
    new ConfigService({ WEB_ORIGIN: 'https://dearly.example' }),
  )
}

describe('PublishLetterUseCase', () => {
  it('publishes a valid Draft and returns its unlisted Share link', async () => {
    const draft = createDraft(await getTemplate('our-story'), {
      recipientName: 'Alex',
      favoriteMemory: 'The first conversation we never wanted to end.',
    })
    const repository = new FakeLetterPublishingRepository(draft)
    const useCase = createUseCase(repository)

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
    })

    expect(repository.publishDraft).toHaveBeenCalledTimes(1)
    expect(repository.publishDraft).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      shareToken: expect.stringMatching(/^[A-Za-z0-9_-]{40,}$/),
    })
    expect(result).toMatchObject({
      letter: { id: 'letter-1', status: 'published' },
      shareUrl: expect.stringMatching(
        /^https:\/\/dearly\.example\/letters\/[A-Za-z0-9_-]{40,}$/,
      ),
    })
  })

  it('reports every missing required Field and does not publish', async () => {
    const draft = createDraft(await getTemplate('our-story'), {})
    const repository = new FakeLetterPublishingRepository(draft)
    const useCase = createUseCase(repository)

    await expect(
      useCase.execute({ creatorId: 'creator-1', letterId: 'letter-1' }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof LetterPublishValidationError)) {
        return false
      }

      expect(error.problems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fieldId: 'recipientName' }),
          expect.objectContaining({ fieldId: 'favoriteMemory' }),
        ]),
      )
      return true
    })
    expect(repository.publishDraft).not.toHaveBeenCalled()
  })

  it('rejects a gallery that violates its configured minimum and explains it', async () => {
    const draft = createDraft(await getTemplate('little-things'), {
      recipientName: 'Alex',
      littleThings: 'All the small details I love about us.',
      sharedPhotos: ['asset-1'],
    })
    const repository = new FakeLetterPublishingRepository(draft)
    const useCase = createUseCase(
      repository,
      new FakeMediaReader([createReadyPhoto('asset-1', 'sharedPhotos')]),
    )

    await expect(
      useCase.execute({ creatorId: 'creator-1', letterId: 'letter-1' }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof LetterPublishValidationError)) {
        return false
      }

      expect(error.problems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fieldId: 'sharedPhotos',
            message: expect.stringContaining('at least 2 photos'),
          }),
        ]),
      )
      return true
    })
    expect(repository.publishDraft).not.toHaveBeenCalled()
  })

  it("does not publish another Creator's Draft", async () => {
    const draft = createDraft(await getTemplate('our-story'), {
      recipientName: 'Alex',
      favoriteMemory: 'A complete memory.',
    })
    const repository = new FakeLetterPublishingRepository(draft)
    const useCase = createUseCase(repository)

    await expect(
      useCase.execute({ creatorId: 'another-creator', letterId: 'letter-1' }),
    ).rejects.toThrow('Letter Draft not found: letter-1')
    expect(repository.publishDraft).not.toHaveBeenCalled()
  })
})
