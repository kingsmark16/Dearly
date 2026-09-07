import { Inject, Injectable } from '@nestjs/common'
import {
  CREATOR_ACCOUNT_DELETION_CONFIRMATION,
  CreatorAccountDeletionValidationError,
  CreatorAccountNotFoundError,
} from '../domain/creator-account.js'
import {
  CREATOR_ACCOUNT_REPOSITORY,
  type CreatorAccountRepository,
} from './ports/creator-account-repository.js'

export type DeleteCreatorAccountCommand = {
  creatorId: string
  confirmation?: string
  requestedAt?: Date
}

export type DeleteCreatorAccountResult = {
  id: string
  status: 'deleted'
}

@Injectable()
export class DeleteCreatorAccountUseCase {
  constructor(
    @Inject(CREATOR_ACCOUNT_REPOSITORY)
    private readonly creatorAccountRepository: CreatorAccountRepository,
  ) {}

  async execute(
    command: DeleteCreatorAccountCommand,
  ): Promise<DeleteCreatorAccountResult> {
    if (command.confirmation !== CREATOR_ACCOUNT_DELETION_CONFIRMATION) {
      throw new CreatorAccountDeletionValidationError(
        'Type DELETE to delete your Creator account',
      )
    }

    const deletion = await this.creatorAccountRepository.requestDeletion({
      creatorId: command.creatorId,
      requestedAt: command.requestedAt ?? new Date(),
    })

    if (!deletion) {
      throw new CreatorAccountNotFoundError(command.creatorId)
    }

    return { id: deletion.creatorId, status: 'deleted' }
  }
}
