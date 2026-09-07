import type {
  CreateLetterDraftRecord,
  CreatorLetterLifecycleRecord,
  CreatorLetterRecord,
  LetterDraftRecord,
  LetterPublishedRecord,
  LetterTrashCandidate,
  PermanentlyDeletedLetter,
  UpdateLetterRecord,
  UpdateLetterDraftRecord,
} from '../../domain/letter.js'
import type { LetterLifecycleAction } from '../../domain/letter.js'

export const LETTER_REPOSITORY = Symbol('LETTER_REPOSITORY')
export const CREATOR_LETTER_READER = Symbol('CREATOR_LETTER_READER')
export const LETTER_EDITOR_REPOSITORY = Symbol('LETTER_EDITOR_REPOSITORY')
export const LETTER_LIFECYCLE_REPOSITORY = Symbol('LETTER_LIFECYCLE_REPOSITORY')
export const LETTER_PUBLISHING_REPOSITORY = Symbol(
  'LETTER_PUBLISHING_REPOSITORY',
)
export const PUBLISHED_LETTER_READER = Symbol('PUBLISHED_LETTER_READER')

export interface LetterDraftReader {
  findDraftById(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord | undefined>
}

export interface LetterOwnerReader {
  findByIdForCreator(
    creatorId: string,
    letterId: string,
  ): Promise<CreatorLetterRecord | undefined>
}

export interface CreatorLetterReader extends LetterOwnerReader {
  listByCreator(creatorId: string): Promise<CreatorLetterLifecycleRecord[]>
}

export interface LetterEditorRepository extends CreatorLetterReader {
  updateLetter(
    input: UpdateLetterRecord,
  ): Promise<CreatorLetterRecord | undefined>
}

export interface LetterLifecycleRepository {
  changeLifecycle(input: {
    creatorId: string
    letterId: string
    action: LetterLifecycleAction
  }): Promise<CreatorLetterLifecycleRecord | undefined>
  permanentlyDelete(input: {
    creatorId: string
    letterId: string
  }): Promise<PermanentlyDeletedLetter | undefined>
  listExpiredTrash(before: Date): Promise<LetterTrashCandidate[]>
}

export interface LetterRepository
  extends LetterDraftReader, CreatorLetterReader {
  createDraft(input: CreateLetterDraftRecord): Promise<LetterDraftRecord>
  updateDraft(
    input: UpdateLetterDraftRecord,
  ): Promise<LetterDraftRecord | undefined>
}

export interface LetterPublishingRepository
  extends LetterDraftReader, LetterOwnerReader {
  publishDraft(input: {
    creatorId: string
    letterId: string
    shareToken: string
  }): Promise<LetterPublishedRecord | undefined>
  publishRevision(input: {
    creatorId: string
    letterId: string
  }): Promise<LetterPublishedRecord | undefined>
}

export interface PublishedLetterReader {
  findPublishedByShareToken(
    shareToken: string,
  ): Promise<LetterPublishedRecord | undefined>
}
