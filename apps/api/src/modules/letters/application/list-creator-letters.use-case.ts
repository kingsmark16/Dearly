import { Inject, Injectable } from '@nestjs/common'
import {
  CREATOR_LETTER_READER,
  type CreatorLetterReader,
} from './ports/letter-repository.js'
import type { CreatorLetterRecord } from '../domain/letter.js'

@Injectable()
export class ListCreatorLettersUseCase {
  constructor(
    @Inject(CREATOR_LETTER_READER)
    private readonly letterRepository: CreatorLetterReader,
  ) {}

  execute(creatorId: string): Promise<CreatorLetterRecord[]> {
    return this.letterRepository.listByCreator(creatorId)
  }
}
