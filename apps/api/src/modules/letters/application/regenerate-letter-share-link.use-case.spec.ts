import { describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterPublishedRecord } from '../domain/letter.js'
import { LetterNotFoundError } from '../domain/letter.js'
import { RegenerateLetterShareLinkUseCase } from './regenerate-letter-share-link.use-case.js'

async function getTemplate() {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug('our-story')

  if (!template) {
    throw new Error('Test template is missing: our-story')
  }

  return template
}

function createPublishedLetter(
  template: LetterPublishedRecord['template'],
  shareToken = 'old-share-token',
): LetterPublishedRecord {
  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'A private letter',
    status: 'published',
    template,
    content: { favoriteMemory: 'The old link still works.' },
    pendingContent: null,
    shareToken,
    viewCount: 0,
    lastViewedAt: null,
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-06T00:01:00.000Z'),
  }
}

describe('RegenerateLetterShareLinkUseCase', () => {
  it('replaces the Share token and returns the replacement Share link', async () => {
    const template = await getTemplate()
    const publishedLetter = createPublishedLetter(template)
    const repository = {
      regenerateShareToken: vi
        .fn<
          (input: {
            creatorId: string
            letterId: string
            shareToken: string
          }) => Promise<LetterPublishedRecord | undefined>
        >()
        .mockImplementation(async ({ shareToken }) => ({
          ...publishedLetter,
          shareToken,
        })),
    }
    const useCase = new RegenerateLetterShareLinkUseCase(
      repository,
      new ConfigService({ WEB_ORIGIN: 'https://dearly.example' }),
    )

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
    })

    expect(repository.regenerateShareToken).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      shareToken: expect.stringMatching(/^[A-Za-z0-9_-]{40,}$/),
    })
    expect(result.letter).toMatchObject({
      id: publishedLetter.id,
      shareToken: expect.stringMatching(/^[A-Za-z0-9_-]{40,}$/),
    })
    expect(result.shareUrl).toMatch(
      /^https:\/\/dearly\.example\/letters\/[A-Za-z0-9_-]{40,}$/,
    )
  })

  it('does not reveal whether another Creator owns the Letter', async () => {
    const repository = {
      regenerateShareToken: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new RegenerateLetterShareLinkUseCase(
      repository,
      new ConfigService({ WEB_ORIGIN: 'https://dearly.example' }),
    )

    await expect(
      useCase.execute({ creatorId: 'wrong-creator', letterId: 'letter-1' }),
    ).rejects.toBeInstanceOf(LetterNotFoundError)
  })
})
