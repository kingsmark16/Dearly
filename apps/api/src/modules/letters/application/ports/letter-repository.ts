import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  LetterPublishedRecord,
  UpdateLetterDraftRecord,
} from '../../domain/letter.js'

export const LETTER_REPOSITORY = Symbol('LETTER_REPOSITORY')
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

export interface LetterRepository extends LetterDraftReader {
  createDraft(input: CreateLetterDraftRecord): Promise<LetterDraftRecord>
  listByCreator(creatorId: string): Promise<LetterDraftRecord[]>
  updateDraft(
    input: UpdateLetterDraftRecord,
  ): Promise<LetterDraftRecord | undefined>
}

export interface LetterPublishingRepository extends LetterDraftReader {
  publishDraft(input: {
    creatorId: string
    letterId: string
    shareToken: string
  }): Promise<LetterPublishedRecord | undefined>
}

export interface PublishedLetterReader {
  findPublishedByShareToken(
    shareToken: string,
  ): Promise<LetterPublishedRecord | undefined>
}
