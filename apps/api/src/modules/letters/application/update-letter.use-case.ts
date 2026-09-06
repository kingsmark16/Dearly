import { Inject, Injectable } from '@nestjs/common'
import {
  getEditableLetterContent,
  LetterNotFoundError,
  validateLetterDraftContent,
  validateLetterDraftTitle,
  type CreatorLetterRecord,
} from '../domain/letter.js'
import {
  LETTER_EDITOR_REPOSITORY,
  type LetterEditorRepository,
} from './ports/letter-repository.js'

export type UpdateLetterCommand = {
  creatorId: string
  letterId: string
  title: string
  content: Record<string, unknown>
}

@Injectable()
export class UpdateLetterUseCase {
  constructor(
    @Inject(LETTER_EDITOR_REPOSITORY)
    private readonly letterRepository: LetterEditorRepository,
  ) {}

  async execute(command: UpdateLetterCommand): Promise<CreatorLetterRecord> {
    const letter = await this.letterRepository.findByIdForCreator(
      command.creatorId,
      command.letterId,
    )

    if (!letter) {
      throw new LetterNotFoundError(command.letterId)
    }

    const updatedLetter = await this.letterRepository.updateLetter({
      creatorId: command.creatorId,
      letterId: command.letterId,
      title: validateLetterDraftTitle(command.title),
      content: validateLetterDraftContent(
        letter.template,
        command.content,
        getEditableLetterContent(letter),
      ),
    })

    if (!updatedLetter) {
      throw new LetterNotFoundError(command.letterId)
    }

    return updatedLetter
  }
}
