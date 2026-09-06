import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  UpdateLetterDraftRecord,
} from '../../domain/letter.js'

export const LETTER_REPOSITORY = Symbol('LETTER_REPOSITORY')

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
