import { describe, expect, it, vi } from 'vitest'
import type { ObjectStorage } from '../media/application/ports/object-storage.js'
import {
  CleanupExpiredLettersUseCase,
  type CleanupExpiredLettersResult,
} from './cleanup-expired-letters.use-case.js'
import type { LetterLifecycleRepository } from './ports/letter-repository.js'

function createRepository() {
  return {
    changeLifecycle: vi.fn(),
    permanentlyDelete: vi.fn().mockResolvedValue({
      letterId: 'expired-letter',
      mediaObjectKeys: ['letters/expired-letter/photo-1'],
    }),
    listExpiredTrash: vi
      .fn()
      .mockResolvedValue([
        { creatorId: 'creator-1', letterId: 'expired-letter' },
      ]),
  } satisfies LetterLifecycleRepository
}

function createStorage() {
  return {
    createUploadIntent: vi.fn(),
    headObject: vi.fn(),
    createDownloadIntent: vi.fn(),
    deleteObject: vi.fn(),
    acceptUpload: vi.fn(),
  } satisfies ObjectStorage
}

describe('CleanupExpiredLettersUseCase', () => {
  it('permanently deletes Trash items older than 90 days and their media', async () => {
    const repository = createRepository()
    const storage = createStorage()
    const useCase = new CleanupExpiredLettersUseCase(repository, storage)

    const result = await useCase.execute(new Date('2026-09-07T00:00:00.000Z'))

    expect(repository.listExpiredTrash).toHaveBeenCalledWith(
      new Date('2026-06-09T00:00:00.000Z'),
    )
    expect(repository.permanentlyDelete).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'expired-letter',
    })
    expect(storage.deleteObject).toHaveBeenCalledWith(
      'letters/expired-letter/photo-1',
    )
    expect(result).toEqual<CleanupExpiredLettersResult>({ deletedCount: 1 })
  })
})
