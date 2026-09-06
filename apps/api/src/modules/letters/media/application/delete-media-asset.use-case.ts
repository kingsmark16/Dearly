import { Inject, Injectable } from '@nestjs/common'
import {
  CREATOR_LETTER_READER,
  type LetterOwnerReader,
} from '../../application/ports/letter-repository.js'
import {
  getEditableLetterContent,
  LetterDraftNotFoundError,
} from '../../domain/letter.js'
import {
  MediaAssetNotFoundError,
  type MediaAssetRecord,
} from '../domain/media-asset.js'
import {
  contentReferencesMediaAsset,
  detachMediaAsset,
} from '../domain/media-content.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetRepository,
} from './ports/media-asset-repository.js'
import { OBJECT_STORAGE, type ObjectStorage } from './ports/object-storage.js'

export type DeleteMediaAssetCommand = {
  creatorId: string
  letterId: string
  assetId: string
}

@Injectable()
export class DeleteMediaAssetUseCase {
  constructor(
    @Inject(CREATOR_LETTER_READER)
    private readonly letterRepository: LetterOwnerReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(command: DeleteMediaAssetCommand): Promise<MediaAssetRecord> {
    const letter = await this.letterRepository.findByIdForCreator(
      command.creatorId,
      command.letterId,
    )

    if (!letter) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const asset = await this.mediaAssetRepository.findForCreator(
      command.creatorId,
      command.letterId,
      command.assetId,
    )

    if (!asset) {
      throw new MediaAssetNotFoundError(command.assetId)
    }

    const content = detachMediaAsset(
      letter.template,
      getEditableLetterContent(letter),
      asset.fieldId,
      asset.id,
    )
    const deletedAsset = await this.mediaAssetRepository.deleteAndDetach({
      creatorId: command.creatorId,
      letterId: command.letterId,
      assetId: command.assetId,
      content,
    })

    if (!deletedAsset) {
      throw new MediaAssetNotFoundError(command.assetId)
    }

    const remainsInPublishedContent =
      letter.status === 'published' &&
      contentReferencesMediaAsset(letter.content, asset.id)

    if (!remainsInPublishedContent) {
      await this.objectStorage.deleteObject(asset.objectKey)
    }

    return deletedAsset
  }
}
