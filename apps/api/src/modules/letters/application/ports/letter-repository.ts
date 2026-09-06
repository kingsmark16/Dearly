import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  UpdateLetterDraftRecord,
} from '../../domain/letter.js'

export const LETTER_REPOSITORY = Symbol('LETTER_REPOSITORY')

export interface LetterRepository {
  createDraft(input: CreateLetterDraftRecord): Promise<LetterDraftRecord>
  listByCreator(creatorId: string): Promise<LetterDraftRecord[]>
  findDraftById(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord | undefined>
  updateDraft(
    input: UpdateLetterDraftRecord,
  ): Promise<LetterDraftRecord | undefined>
}
