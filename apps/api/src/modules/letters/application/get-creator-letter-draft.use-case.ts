import { Inject, Injectable } from '@nestjs/common'
import {
  LetterDraftNotFoundError,
  type LetterDraftRecord,
} from '../domain/letter.js'
import {
  LETTER_REPOSITORY,
  type LetterRepository,
} from './ports/letter-repository.js'

@Injectable()
export class GetCreatorLetterDraftUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterRepository,
  ) {}

  async execute(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord> {
    const draft = await this.letterRepository.findDraftById(creatorId, letterId)

    if (!draft) {
      throw new LetterDraftNotFoundError(letterId)
    }

    return draft
  }
}
