import { Inject, Injectable } from '@nestjs/common'
import {
  LETTER_REPOSITORY,
  type LetterRepository,
} from './ports/letter-repository.js'
import type { LetterDraftRecord } from '../domain/letter.js'

@Injectable()
export class ListCreatorLettersUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterRepository,
  ) {}

  execute(creatorId: string): Promise<LetterDraftRecord[]> {
    return this.letterRepository.listByCreator(creatorId)
  }
}
