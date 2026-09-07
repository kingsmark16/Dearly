import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  getEditableLetterContent,
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
import { createLetterShareUrl } from './share-url.js'
import { createLetterShareToken } from './share-token.js'
export type PublishLetterCommand = {
  creatorId: string
  letterId: string
}

export type PublishLetterResult = {
  letter: LetterPublishedRecord
  shareUrl: string
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
    const letter = await this.letterRepository.findByIdForCreator(
      command.creatorId,
      command.letterId,
    )

    if (!letter) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const assets = await this.mediaAssetReader.listForCreator(
      command.creatorId,
      command.letterId,
    )
    const problems = validatePublishableLetter(
      letter.template,
      getEditableLetterContent(letter),
      assets,
    )

    if (problems.length > 0) {
      throw new LetterPublishValidationError(problems)
    }

    const publishedLetter =
      letter.status === 'draft'
        ? await this.letterRepository.publishDraft({
            creatorId: command.creatorId,
            letterId: command.letterId,
            shareToken: createLetterShareToken(),
          })
        : await this.letterRepository.publishRevision({
            creatorId: command.creatorId,
            letterId: command.letterId,
          })

    if (!publishedLetter) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    return {
      letter: publishedLetter,
      shareUrl: createLetterShareUrl(
        this.configService.getOrThrow<string>('WEB_ORIGIN'),
        publishedLetter.shareToken,
      ),
    }
  }
}
