import { describe, expect, it, vi } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type {
  CreatorLetterRecord,
  LetterPublishedRecord,
} from '../domain/letter.js'
import { GetCreatorLetterUseCase } from './get-creator-letter.use-case.js'
import type { CreatorLetterReader } from './ports/letter-repository.js'

async function getPublishedLetter(): Promise<LetterPublishedRecord> {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug('our-story')

  if (!template) {
    throw new Error('Test template is missing')
  }

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
    pendingContent: {
      recipientName: 'Alex',
      favoriteMemory: 'The new pending memory.',
    },
    shareToken: 'stable-share-token',
    viewCount: 0,
    lastViewedAt: null,
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

describe('GetCreatorLetterUseCase', () => {
  it('returns a Published Letter with its Pending revision for its owner', async () => {
    const letter = await getPublishedLetter()
    const reader: CreatorLetterReader = {
      findByIdForCreator: vi.fn().mockResolvedValue(letter),
      listByCreator: vi.fn().mockResolvedValue([letter]),
    }
    const useCase = new GetCreatorLetterUseCase(reader)

    const result = await useCase.execute('creator-1', 'letter-1')

    expect(result).toEqual<CreatorLetterRecord>(letter)
  })

  it('does not return a Letter owned by another Creator', async () => {
    const reader: CreatorLetterReader = {
      findByIdForCreator: vi.fn().mockResolvedValue(undefined),
      listByCreator: vi.fn().mockResolvedValue([]),
    }
    const useCase = new GetCreatorLetterUseCase(reader)

    await expect(
      useCase.execute('another-creator', 'letter-1'),
    ).rejects.toThrow('Letter not found: letter-1')
  })
})
