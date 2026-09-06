import { Inject, Injectable } from '@nestjs/common'
import {
  LetterDraftNotFoundError,
  validateLetterDraftContent,
  validateLetterDraftTitle,
  type LetterDraftRecord,
} from '../domain/letter.js'
import {
  LETTER_REPOSITORY,
  type LetterRepository,
} from './ports/letter-repository.js'

export type UpdateLetterDraftCommand = {
  creatorId: string
  letterId: string
  title: string
  content: Record<string, unknown>
}

@Injectable()
export class UpdateLetterDraftUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterRepository,
  ) {}

  async execute(command: UpdateLetterDraftCommand): Promise<LetterDraftRecord> {
    const draft = await this.letterRepository.findDraftById(
      command.creatorId,
      command.letterId,
    )

    if (!draft) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const updatedDraft = await this.letterRepository.updateDraft({
      creatorId: command.creatorId,
      letterId: command.letterId,
      title: validateLetterDraftTitle(command.title),
      content: validateLetterDraftContent(draft.template, command.content),
    })

    if (!updatedDraft) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    return updatedDraft
  }
}
