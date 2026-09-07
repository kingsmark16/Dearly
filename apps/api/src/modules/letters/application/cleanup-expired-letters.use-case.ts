import { Inject, Injectable } from '@nestjs/common'
import {
  getTrashRetentionCutoff,
  type PermanentlyDeletedLetter,
} from '../domain/letter.js'
import {
  LETTER_LIFECYCLE_REPOSITORY,
  type LetterLifecycleRepository,
} from './ports/letter-repository.js'
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../media/application/ports/object-storage.js'

export type CleanupExpiredLettersResult = {
  deletedCount: number
}

async function deleteMediaObjects(
  objectStorage: ObjectStorage,
  deleted: PermanentlyDeletedLetter,
) {
  await Promise.all(
    deleted.mediaObjectKeys.map((key) => objectStorage.deleteObject(key)),
  )
}

@Injectable()
export class CleanupExpiredLettersUseCase {
  constructor(
    @Inject(LETTER_LIFECYCLE_REPOSITORY)
    private readonly letterRepository: LetterLifecycleRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(now: Date = new Date()): Promise<CleanupExpiredLettersResult> {
    const candidates = await this.letterRepository.listExpiredTrash(
      getTrashRetentionCutoff(now),
    )
    let deletedCount = 0

    for (const candidate of candidates) {
      const deleted = await this.letterRepository.permanentlyDelete(candidate)

      if (!deleted) {
        continue
      }

      await deleteMediaObjects(this.objectStorage, deleted)
      deletedCount += 1
    }

    return { deletedCount }
  }
}
