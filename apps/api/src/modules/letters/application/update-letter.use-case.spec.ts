import { describe, expect, it } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type {
  LetterPublishedRecord,
  UpdateLetterRecord,
} from '../domain/letter.js'
import { UpdateLetterUseCase } from './update-letter.use-case.js'
import type { LetterEditorRepository } from './ports/letter-repository.js'

async function getTemplate() {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug('our-story')

  if (!template) {
    throw new Error('Test template is missing')
  }

  return template
}

function createPublishedLetter(
  template: LetterPublishedRecord['template'],
): LetterPublishedRecord {
  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'Our story',
    status: 'published',
    template,
    content: {
      recipientName: 'Alex',
      favoriteMemory: 'The old published memory.',
    },
    pendingContent: null,
    shareToken: 'stable-share-token',
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

class RecordingLetterEditorRepository implements LetterEditorRepository {
  readonly updated: UpdateLetterRecord[] = []

  constructor(readonly letter: LetterPublishedRecord) {}

  async findByIdForCreator(creatorId: string, letterId: string) {
    return this.letter.creatorId === creatorId && this.letter.id === letterId
      ? this.letter
      : undefined
  }

  async listByCreator() {
    return [this.letter]
  }

  async updateLetter(input: UpdateLetterRecord) {
    this.updated.push(input)

    return {
      ...this.letter,
      title: input.title,
      pendingContent: input.content,
      updatedAt: new Date('2026-09-06T00:02:00.000Z'),
    }
  }
}

describe('UpdateLetterUseCase', () => {
  it('saves a Published Letter edit as a Pending revision', async () => {
    const repository = new RecordingLetterEditorRepository(
      createPublishedLetter(await getTemplate()),
    )
    const useCase = new UpdateLetterUseCase(repository)

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      title: '  A newer chapter  ',
      content: {
        recipientName: 'Alex',
        favoriteMemory: 'A new memory that is not live yet.',
      },
    })

    expect(repository.updated).toEqual([
      {
        creatorId: 'creator-1',
        letterId: 'letter-1',
        title: 'A newer chapter',
        content: {
          recipientName: 'Alex',
          favoriteMemory: 'A new memory that is not live yet.',
        },
      },
    ])
    expect(result).toMatchObject({
      status: 'published',
      content: {
        favoriteMemory: 'The old published memory.',
      },
      pendingContent: {
        favoriteMemory: 'A new memory that is not live yet.',
      },
      shareToken: 'stable-share-token',
    })
  })

  it('does not update a Letter owned by another Creator', async () => {
    const repository = new RecordingLetterEditorRepository(
      createPublishedLetter(await getTemplate()),
    )
    const useCase = new UpdateLetterUseCase(repository)

    await expect(
      useCase.execute({
        creatorId: 'another-creator',
        letterId: 'letter-1',
        title: 'Not yours',
        content: {},
      }),
    ).rejects.toThrow('Letter not found: letter-1')
    expect(repository.updated).toHaveLength(0)
  })
})
