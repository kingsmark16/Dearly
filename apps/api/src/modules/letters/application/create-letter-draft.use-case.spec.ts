import { describe, expect, it } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import {
  CreateLetterDraftUseCase,
  type CreateLetterDraftCommand,
} from './create-letter-draft.use-case.js'
import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
} from '../domain/letter.js'
import type { LetterRepository } from './ports/letter-repository.js'

class RecordingLetterRepository implements LetterRepository {
  readonly created: CreateLetterDraftRecord[] = []

  async createDraft(
    input: CreateLetterDraftRecord,
  ): Promise<LetterDraftRecord> {
    this.created.push(input)

    return {
      id: 'letter-1',
      creatorId: input.creatorId,
      title: input.title,
      status: 'draft',
      template: input.template,
      content: {},
      createdAt: new Date('2026-09-06T00:00:00.000Z'),
      updatedAt: new Date('2026-09-06T00:00:00.000Z'),
    }
  }

  async listByCreator(): Promise<LetterDraftRecord[]> {
    return []
  }

  async findDraftById(): Promise<LetterDraftRecord | undefined> {
    return undefined
  }

  async updateDraft(): Promise<LetterDraftRecord | undefined> {
    return undefined
  }
}

describe('CreateLetterDraftUseCase', () => {
  it('creates a draft from the selected template snapshot', async () => {
    const catalogRepository = new InMemoryCatalogRepository()
    const letterRepository = new RecordingLetterRepository()
    const useCase = new CreateLetterDraftUseCase(
      catalogRepository,
      letterRepository,
    )

    const command: CreateLetterDraftCommand = {
      creatorId: 'creator-1',
      templateSlug: 'our-story',
      title: '  The day we met  ',
    }

    const draft = await useCase.execute(command)

    expect(letterRepository.created).toHaveLength(1)
    expect(letterRepository.created[0]).toMatchObject({
      creatorId: 'creator-1',
      title: 'The day we met',
      template: {
        slug: 'our-story',
        version: 1,
        category: { slug: 'love-letter' },
      },
    })
    expect(draft).toMatchObject({
      id: 'letter-1',
      title: 'The day we met',
      status: 'draft',
      content: {},
    })
  })

  it('uses the template name when the Creator does not provide a title', async () => {
    const catalogRepository = new InMemoryCatalogRepository()
    const letterRepository = new RecordingLetterRepository()
    const useCase = new CreateLetterDraftUseCase(
      catalogRepository,
      letterRepository,
    )

    await useCase.execute({
      creatorId: 'creator-1',
      templateSlug: 'our-story',
    })

    expect(letterRepository.created[0]?.title).toBe('Our Story')
  })

  it('rejects a template that is not in the catalog', async () => {
    const catalogRepository = new InMemoryCatalogRepository()
    const letterRepository = new RecordingLetterRepository()
    const useCase = new CreateLetterDraftUseCase(
      catalogRepository,
      letterRepository,
    )

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        templateSlug: 'missing-template',
      }),
    ).rejects.toThrow('Catalog template not found: missing-template')
    expect(letterRepository.created).toHaveLength(0)
  })
})
