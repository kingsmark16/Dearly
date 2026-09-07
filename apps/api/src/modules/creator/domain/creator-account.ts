export const CREATOR_ACCOUNT_DELETION_CONFIRMATION = 'DELETE'

export type CreatorAccountDeletionRequest = {
  creatorId: string
  requestedAt: Date
}

export type CreatorAccountDeletionRecord = {
  creatorId: string
  deletionRequestedAt: Date
  trashedLetterCount: number
  alreadyRequested: boolean
}

export class CreatorAccountDeletionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CreatorAccountDeletionValidationError'
  }
}

export class CreatorAccountNotFoundError extends Error {
  constructor(creatorId: string) {
    super(`Creator account not found: ${creatorId}`)
    this.name = 'CreatorAccountNotFoundError'
  }
}
