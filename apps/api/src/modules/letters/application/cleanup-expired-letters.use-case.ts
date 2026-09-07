import { Inject, Injectable } from '@nestjs/common'
import {
  CREATOR_ACCOUNT_REPOSITORY,
  type CreatorAccountRepository,
} from '../../creator/application/ports/creator-account-repository.js'
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
  deletedCreatorCount: number
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
    @Inject(CREATOR_ACCOUNT_REPOSITORY)
    private readonly creatorAccountRepository: CreatorAccountRepository,
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

    const expiredCreators =
      await this.creatorAccountRepository.listExpiredDeletions(
        getTrashRetentionCutoff(now),
      )
    let deletedCreatorCount = 0

    for (const creatorId of expiredCreators) {
      if (
        await this.creatorAccountRepository.permanentlyDeleteAccount(creatorId)
      ) {
        deletedCreatorCount += 1
      }
    }

    return { deletedCount, deletedCreatorCount }
  }
}
