import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'node:crypto'
import {
  LetterDraftNotFoundError,
  LetterPublishValidationError,
  type LetterPublishedRecord,
} from '../domain/letter.js'
import { validatePublishableLetter } from '../domain/publish-validation.js'
import {
  LETTER_PUBLISHING_REPOSITORY,
  type LetterPublishingRepository,
} from './ports/letter-repository.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetReader,
} from '../media/application/ports/media-asset-repository.js'

export type PublishLetterCommand = {
  creatorId: string
  letterId: string
}

export type PublishLetterResult = {
  letter: LetterPublishedRecord
  shareUrl: string
}

function createShareToken() {
  return randomBytes(32).toString('base64url')
}

function createShareUrl(webOrigin: string, shareToken: string) {
  const origin = webOrigin.split(',')[0]?.trim()

  if (!origin) {
    throw new Error('WEB_ORIGIN must contain at least one web origin')
  }

  return new URL(`/letters/${shareToken}`, origin).toString()
}

@Injectable()
export class PublishLetterUseCase {
  constructor(
    @Inject(LETTER_PUBLISHING_REPOSITORY)
    private readonly letterRepository: LetterPublishingRepository,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetReader: MediaAssetReader,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  async execute(command: PublishLetterCommand): Promise<PublishLetterResult> {
    const draft = await this.letterRepository.findDraftById(
      command.creatorId,
      command.letterId,
    )

    if (!draft) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const assets = await this.mediaAssetReader.listForCreator(
      command.creatorId,
      command.letterId,
    )
    const problems = validatePublishableLetter(
      draft.template,
      draft.content,
      assets,
    )

    if (problems.length > 0) {
      throw new LetterPublishValidationError(problems)
    }

    const shareToken = createShareToken()
    const letter = await this.letterRepository.publishDraft({
      creatorId: command.creatorId,
      letterId: command.letterId,
      shareToken,
    })

    if (!letter) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    return {
      letter,
      shareUrl: createShareUrl(
        this.configService.getOrThrow<string>('WEB_ORIGIN'),
        letter.shareToken,
      ),
    }
  }
}
