import { Inject, Injectable } from '@nestjs/common'
import {
  LETTER_REPOSITORY,
  type LetterDraftReader,
} from '../../application/ports/letter-repository.js'
import { LetterDraftNotFoundError } from '../../domain/letter.js'
import {
  MediaAssetNotFoundError,
  type MediaAssetRecord,
} from '../domain/media-asset.js'
import { detachMediaAsset } from '../domain/media-content.js'
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
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterDraftReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(command: DeleteMediaAssetCommand): Promise<MediaAssetRecord> {
    const draft = await this.letterRepository.findDraftById(
      command.creatorId,
      command.letterId,
    )

    if (!draft) {
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
      draft.template,
      draft.content,
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

    await this.objectStorage.deleteObject(asset.objectKey)
    return deletedAsset
  }
}
