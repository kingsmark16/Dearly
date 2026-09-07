import type {
  CreatorAccountDeletionRecord,
  CreatorAccountDeletionRequest,
} from '../../domain/creator-account.js'

export const CREATOR_ACCOUNT_REPOSITORY = Symbol('CREATOR_ACCOUNT_REPOSITORY')

export interface CreatorAccountRepository {
  requestDeletion(
    input: CreatorAccountDeletionRequest,
  ): Promise<CreatorAccountDeletionRecord | undefined>
  listExpiredDeletions(before: Date): Promise<string[]>
  permanentlyDeleteAccount(creatorId: string): Promise<boolean>
}
