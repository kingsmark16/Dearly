import { describe, expect, it, vi } from 'vitest'
import { InMemoryCatalogRepository } from '../../catalog/infrastructure/in-memory-catalog.repository.js'
import type { LetterArchivedRecord } from '../domain/letter.js'
import type { ObjectStorage } from '../media/application/ports/object-storage.js'
import {
  ChangeLetterLifecycleUseCase,
  type ChangeLetterLifecycleCommand,
} from './change-letter-lifecycle.use-case.js'
import type { LetterLifecycleRepository } from './ports/letter-repository.js'

async function createArchivedLetter(): Promise<LetterArchivedRecord> {
  const catalogRepository = new InMemoryCatalogRepository()
  const template = await catalogRepository.findTemplateBySlug('our-story')

  if (!template) {
    throw new Error('Test template is missing')
  }

  return {
    id: 'letter-1',
    creatorId: 'creator-1',
    title: 'Our story',
    status: 'archived',
    template,
    restoreStatus: 'published',
    shareToken: 'stable-share-token',
    archivedAt: new Date('2026-09-07T00:00:00.000Z'),
    createdAt: new Date('2026-09-06T00:00:00.000Z'),
    updatedAt: new Date('2026-09-07T00:00:00.000Z'),
  }
}

function createRepository(letter: LetterArchivedRecord) {
  return {
    changeLifecycle: vi.fn().mockResolvedValue(letter),
    permanentlyDelete: vi.fn(),
    listExpiredTrash: vi.fn(),
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

describe('ChangeLetterLifecycleUseCase', () => {
  it('archives an active Letter for its owning Creator', async () => {
    const archivedLetter = await createArchivedLetter()
    const repository = createRepository(archivedLetter)
    const useCase = new ChangeLetterLifecycleUseCase(repository)
    const command: ChangeLetterLifecycleCommand = {
      creatorId: 'creator-1',
      letterId: 'letter-1',
      action: 'archive',
    }

    const result = await useCase.execute(command)

    expect(repository.changeLifecycle).toHaveBeenCalledWith(command)
    expect(result).toEqual(archivedLetter)
  })

  it('does not change a Letter owned by another Creator', async () => {
    const archivedLetter = await createArchivedLetter()
    const repository = createRepository(archivedLetter)
    repository.changeLifecycle.mockResolvedValue(undefined)
    const useCase = new ChangeLetterLifecycleUseCase(repository)

    await expect(
      useCase.execute({
        creatorId: 'another-creator',
        letterId: 'letter-1',
        action: 'trash',
      }),
    ).rejects.toThrow('Letter not found: letter-1')
    expect(repository.changeLifecycle).toHaveBeenCalledWith({
      creatorId: 'another-creator',
      letterId: 'letter-1',
      action: 'trash',
    })
  })

  it('requires explicit confirmation and removes every associated media object', async () => {
    const archivedLetter = await createArchivedLetter()
    const repository = createRepository(archivedLetter)
    repository.permanentlyDelete.mockResolvedValue({
      letterId: 'letter-1',
      mediaObjectKeys: ['letters/letter-1/photo-1', 'letters/letter-1/audio-1'],
    })
    const storage = createStorage()
    const useCase = new ChangeLetterLifecycleUseCase(repository, storage)

    await expect(
      useCase.execute({
        creatorId: 'creator-1',
        letterId: 'letter-1',
        action: 'permanent-delete',
        confirmation: 'delete',
      }),
    ).rejects.toThrow('Type DELETE to permanently delete a Letter from Trash')
    expect(repository.permanentlyDelete).not.toHaveBeenCalled()

    const result = await useCase.execute({
      creatorId: 'creator-1',
      letterId: 'letter-1',
      action: 'permanent-delete',
      confirmation: 'DELETE',
    })

    expect(repository.permanentlyDelete).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      letterId: 'letter-1',
    })
    expect(storage.deleteObject).toHaveBeenCalledWith(
      'letters/letter-1/photo-1',
    )
    expect(storage.deleteObject).toHaveBeenCalledWith(
      'letters/letter-1/audio-1',
    )
    expect(result).toEqual({ id: 'letter-1', status: 'deleted' })
  })
})
