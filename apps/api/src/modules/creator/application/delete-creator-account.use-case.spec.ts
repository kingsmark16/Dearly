import { describe, expect, it, vi } from 'vitest'
import type { CreatorAccountRepository } from './ports/creator-account-repository.js'
import {
  DeleteCreatorAccountUseCase,
  type DeleteCreatorAccountCommand,
} from './delete-creator-account.use-case.js'

function createRepository() {
  return {
    requestDeletion: vi.fn(),
    listExpiredDeletions: vi.fn(),
    permanentlyDeleteAccount: vi.fn(),
  } satisfies CreatorAccountRepository
}

describe('DeleteCreatorAccountUseCase', () => {
  it('requires the explicit DELETE confirmation before changing the account', async () => {
    const repository = createRepository()
    const useCase = new DeleteCreatorAccountUseCase(repository)
    const command: DeleteCreatorAccountCommand = {
      creatorId: 'creator-1',
      confirmation: 'delete',
      requestedAt: new Date('2026-09-07T00:00:00.000Z'),
    }

    await expect(useCase.execute(command)).rejects.toThrow(
      'Type DELETE to delete your Creator account',
    )
    expect(repository.requestDeletion).not.toHaveBeenCalled()
  })

  it('requests one transactional account deletion with the requested timestamp', async () => {
    const repository = createRepository()
    const requestedAt = new Date('2026-09-07T00:00:00.000Z')
    repository.requestDeletion.mockResolvedValue({
      creatorId: 'creator-1',
      deletionRequestedAt: requestedAt,
      trashedLetterCount: 2,
      alreadyRequested: false,
    })
    const useCase = new DeleteCreatorAccountUseCase(repository)

    const result = await useCase.execute({
      creatorId: 'creator-1',
      confirmation: 'DELETE',
      requestedAt,
    })

    expect(repository.requestDeletion).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      requestedAt,
    })
    expect(result).toEqual({ id: 'creator-1', status: 'deleted' })
  })

  it('reports a missing Creator account without pretending deletion succeeded', async () => {
    const repository = createRepository()
    repository.requestDeletion.mockResolvedValue(undefined)
    const useCase = new DeleteCreatorAccountUseCase(repository)

    await expect(
      useCase.execute({ creatorId: 'missing', confirmation: 'DELETE' }),
    ).rejects.toThrow('Creator account not found: missing')
  })
})
