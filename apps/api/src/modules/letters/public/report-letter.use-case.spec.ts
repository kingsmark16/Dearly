import { describe, expect, it, vi } from 'vitest'
import type { LetterReportRepository } from '../application/ports/letter-repository.js'
import { ReportLetterUseCase } from './report-letter.use-case.js'

function createRepository(isCreated = true) {
  return {
    createForPublishedShareToken: vi.fn().mockResolvedValue(isCreated),
  } satisfies LetterReportRepository
}

describe('ReportLetterUseCase', () => {
  it('records a report for an active Published Letter', async () => {
    const repository = createRepository()
    const useCase = new ReportLetterUseCase(repository)

    const result = await useCase.execute({
      shareToken: 'share-token-1',
      reason: 'inappropriate-content',
      details: 'This content needs review.',
    })

    expect(repository.createForPublishedShareToken).toHaveBeenCalledWith({
      shareToken: 'share-token-1',
      reason: 'inappropriate-content',
      details: 'This content needs review.',
    })
    expect(result).toEqual({ status: 'received' })
  })

  it('does not acknowledge a report for an unavailable Published Letter', async () => {
    const repository = createRepository(false)
    const useCase = new ReportLetterUseCase(repository)

    await expect(
      useCase.execute({
        shareToken: 'archived-token',
        reason: 'other',
      }),
    ).resolves.toBeUndefined()
  })
})
