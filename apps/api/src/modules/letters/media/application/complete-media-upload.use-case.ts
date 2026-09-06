import { Inject, Injectable } from '@nestjs/common'
import {
  LETTER_REPOSITORY,
  type LetterDraftReader,
} from '../../application/ports/letter-repository.js'
import { LetterDraftNotFoundError } from '../../domain/letter.js'
import {
  MediaAssetNotFoundError,
  MediaAssetValidationError,
  type MediaAssetRecord,
} from '../domain/media-asset.js'
import { attachMediaAsset } from '../domain/media-content.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetRepository,
} from './ports/media-asset-repository.js'
import { OBJECT_STORAGE, type ObjectStorage } from './ports/object-storage.js'

export type CompleteMediaUploadCommand = {
  creatorId: string
  letterId: string
  assetId: string
}

@Injectable()
export class CompleteMediaUploadUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterDraftReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(
    command: CompleteMediaUploadCommand,
  ): Promise<MediaAssetRecord> {
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

    if (asset.status === 'ready') {
      return asset
    }

    if (asset.expiresAt.getTime() <= Date.now()) {
      throw new MediaAssetValidationError('Media upload intent has expired')
    }

    const storedObject = await this.objectStorage.headObject(asset.objectKey)

    if (!storedObject) {
      throw new MediaAssetValidationError(
        'Media upload is not complete. Please try uploading the file again.',
      )
    }

    if (
      storedObject.contentType !== asset.contentType ||
      storedObject.byteSize !== asset.byteSize
    ) {
      await this.objectStorage.deleteObject(asset.objectKey)
      throw new MediaAssetValidationError(
        'Uploaded media did not match the requested file metadata',
      )
    }

    const content = attachMediaAsset(
      draft.template,
      draft.content,
      asset.fieldId,
      asset.id,
    )
    const completedAsset = await this.mediaAssetRepository.completeAndAttach({
      creatorId: command.creatorId,
      letterId: command.letterId,
      assetId: command.assetId,
      content,
    })

    if (!completedAsset) {
      throw new MediaAssetNotFoundError(command.assetId)
    }

    return completedAsset
  }
}
