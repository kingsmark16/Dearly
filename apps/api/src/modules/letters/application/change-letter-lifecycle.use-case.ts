import { Inject, Injectable, Optional } from '@nestjs/common'
import {
  LetterNotFoundError,
  LetterLifecycleValidationError,
  type CreatorLetterLifecycleRecord,
  type LetterLifecycleAction,
} from '../domain/letter.js'
import {
  LETTER_LIFECYCLE_REPOSITORY,
  type LetterLifecycleRepository,
} from './ports/letter-repository.js'
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../media/application/ports/object-storage.js'

export type ChangeLetterLifecycleCommand = {
  creatorId: string
  letterId: string
  action: LetterLifecycleAction | 'permanent-delete'
  confirmation?: string
}

export type LetterLifecycleChangeResult =
  CreatorLetterLifecycleRecord | { id: string; status: 'deleted' }

const PERMANENT_DELETE_CONFIRMATION = 'DELETE'

@Injectable()
export class ChangeLetterLifecycleUseCase {
  constructor(
    @Inject(LETTER_LIFECYCLE_REPOSITORY)
    private readonly letterRepository: LetterLifecycleRepository,
    @Optional()
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage?: ObjectStorage,
  ) {}

  async execute(
    command: ChangeLetterLifecycleCommand,
  ): Promise<LetterLifecycleChangeResult> {
    if (command.action === 'permanent-delete') {
      if (command.confirmation !== PERMANENT_DELETE_CONFIRMATION) {
        throw new LetterLifecycleValidationError(
          'Type DELETE to permanently delete a Letter from Trash',
        )
      }

      const deleted = await this.letterRepository.permanentlyDelete({
        creatorId: command.creatorId,
        letterId: command.letterId,
      })

      if (!deleted) {
        throw new LetterNotFoundError(command.letterId)
      }

      if (!this.objectStorage) {
        throw new Error('Object storage is required for permanent deletion')
      }

      const objectStorage = this.objectStorage
      await Promise.all(
        deleted.mediaObjectKeys.map((key) => objectStorage.deleteObject(key)),
      )

      return { id: deleted.letterId, status: 'deleted' }
    }

    const letter = await this.letterRepository.changeLifecycle({
      creatorId: command.creatorId,
      letterId: command.letterId,
      action: command.action,
    })

    if (!letter) {
      throw new LetterNotFoundError(command.letterId)
    }

    return letter
  }
}
