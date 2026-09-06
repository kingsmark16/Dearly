import { describe, expect, it } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  UpdateLetterDraftRecord,
} from '../domain/letter.js'
import { UpdateLetterDraftUseCase } from './update-letter-draft.use-case.js'
import type { LetterRepository } from './ports/letter-repository.js'

class InMemoryLetterRepository implements LetterRepository {
  readonly updated: UpdateLetterDraftRecord[] = []
  readonly draft: LetterDraftRecord

  constructor(template: LetterDraftRecord['template']) {
    this.draft = {
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

  async createDraft(
    input: CreateLetterDraftRecord,
  ): Promise<LetterDraftRecord> {
    return {
      ...this.draft,
      creatorId: input.creatorId,
      title: input.title,
      template: input.template,
    }
  }

  async listByCreator(): Promise<LetterDraftRecord[]> {
    return [this.draft]
  }

  async findDraftById(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord | undefined> {
    return this.draft.creatorId === creatorId && this.draft.id === letterId
      ? this.draft
      : undefined
  }

  async updateDraft(
    input: UpdateLetterDraftRecord,
  ): Promise<LetterDraftRecord | undefined> {
    this.updated.push(input)

    return {
      ...this.draft,
      title: input.title,
      content: input.content,
      updatedAt: new Date('2026-09-06T00:01:00.000Z'),
    }
  }
}

async function getTemplate(slug: string) {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug(slug)

  if (!template) {
    throw new Error('Test template is missing')
  }

  return template
}

async function getOurStoryTemplate() {
  return getTemplate('our-story')
}

describe('UpdateLetterDraftUseCase', () => {
  it('updates the owning Creator draft title and editable text Fields', async () => {
    const repository = new InMemoryLetterRepository(await getOurStoryTemplate())
    const useCase = new UpdateLetterDraftUseCase(repository)

    const draft = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      title: '  The day we met  ',
      content: {
        recipientName: 'Alex',
        favoriteMemory: 'The first conversation we never wanted to end.',
      },
    })

    expect(repository.updated).toEqual([
      {
        creatorId: 'creator-1',
        letterId: 'letter-1',
        title: 'The day we met',
        content: {
          recipientName: 'Alex',
          favoriteMemory: 'The first conversation we never wanted to end.',
        },
      },
    ])
    expect(draft).toMatchObject({
      id: 'letter-1',
      title: 'The day we met',
      content: {
        recipientName: 'Alex',
      },
    })
  })

  it('rejects an unknown Field before persistence', async () => {
    const repository = new InMemoryLetterRepository(await getOurStoryTemplate())
    const useCase = new UpdateLetterDraftUseCase(repository)

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        title: 'Our story',
        content: { notAField: 'should not be stored' },
      }),
    ).rejects.toThrow('Unknown Letter Field: notAField')
    expect(repository.updated).toHaveLength(0)
  })

  it('rejects changing media references through the text Draft endpoint', async () => {
    const repository = new InMemoryLetterRepository(
      await getTemplate('little-things'),
    )
    const useCase = new UpdateLetterDraftUseCase(repository)

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        title: 'Our story',
        content: { sharedPhotos: ['asset-1'] },
      }),
    ).rejects.toThrow(
      'Letter media Field must be changed through media operations: sharedPhotos',
    )
    expect(repository.updated).toHaveLength(0)
  })

  it('does not reveal a draft to another Creator', async () => {
    const repository = new InMemoryLetterRepository(await getOurStoryTemplate())
    const useCase = new UpdateLetterDraftUseCase(repository)

    await expect(
      useCase.execute({
        creatorId: 'another-creator',
        letterId: 'letter-1',
        title: 'Our story',
        content: {},
      }),
    ).rejects.toThrow('Letter Draft not found: letter-1')
    expect(repository.updated).toHaveLength(0)
  })
})
