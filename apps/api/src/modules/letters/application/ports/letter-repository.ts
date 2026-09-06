import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
} from '../../domain/letter.js'

export const LETTER_REPOSITORY = Symbol('LETTER_REPOSITORY')

export interface LetterRepository {
  createDraft(input: CreateLetterDraftRecord): Promise<LetterDraftRecord>
  listByCreator(creatorId: string): Promise<LetterDraftRecord[]>
}
