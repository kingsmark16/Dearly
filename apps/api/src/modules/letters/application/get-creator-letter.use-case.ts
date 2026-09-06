import { Inject, Injectable } from '@nestjs/common'
import {
  LetterNotFoundError,
  type CreatorLetterRecord,
} from '../domain/letter.js'
import {
  CREATOR_LETTER_READER,
  type CreatorLetterReader,
} from './ports/letter-repository.js'

@Injectable()
export class GetCreatorLetterUseCase {
  constructor(
    @Inject(CREATOR_LETTER_READER)
    private readonly letterReader: CreatorLetterReader,
  ) {}

  async execute(
    creatorId: string,
    letterId: string,
  ): Promise<CreatorLetterRecord> {
    const letter = await this.letterReader.findByIdForCreator(
      creatorId,
      letterId,
    )

    if (!letter) {
      throw new LetterNotFoundError(letterId)
    }

    return letter
  }
}
