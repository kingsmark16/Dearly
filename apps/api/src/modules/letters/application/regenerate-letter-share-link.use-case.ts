import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  LetterNotFoundError,
  type LetterPublishedRecord,
} from '../domain/letter.js'
import { createLetterShareUrl } from './share-url.js'
import {
  LETTER_SHARE_LINK_REPOSITORY,
  type LetterShareLinkRepository,
} from './ports/letter-repository.js'
import { createLetterShareToken } from './share-token.js'

export type RegenerateLetterShareLinkCommand = {
  creatorId: string
  letterId: string
}

export type RegenerateLetterShareLinkResult = {
  letter: LetterPublishedRecord
  shareUrl: string
}

@Injectable()
export class RegenerateLetterShareLinkUseCase {
  constructor(
    @Inject(LETTER_SHARE_LINK_REPOSITORY)
    private readonly letterRepository: LetterShareLinkRepository,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: RegenerateLetterShareLinkCommand,
  ): Promise<RegenerateLetterShareLinkResult> {
    const letter = await this.letterRepository.regenerateShareToken({
      creatorId: command.creatorId,
      letterId: command.letterId,
      shareToken: createLetterShareToken(),
    })

    if (!letter) {
      throw new LetterNotFoundError(command.letterId)
    }

    return {
      letter,
      shareUrl: createLetterShareUrl(
        this.configService.getOrThrow<string>('WEB_ORIGIN'),
        letter.shareToken,
      ),
    }
  }
}
