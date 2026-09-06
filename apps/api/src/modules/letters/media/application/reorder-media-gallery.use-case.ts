import { Inject, Injectable } from '@nestjs/common'
import {
  LETTER_REPOSITORY,
  type LetterDraftReader,
} from '../../application/ports/letter-repository.js'
import { LetterDraftNotFoundError } from '../../domain/letter.js'
import { MediaAssetValidationError } from '../domain/media-asset.js'
import { reorderMediaAssets } from '../domain/media-content.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetRepository,
} from './ports/media-asset-repository.js'

export type ReorderMediaGalleryCommand = {
  creatorId: string
  letterId: string
  fieldId: string
  assetIds: string[]
}

@Injectable()
export class ReorderMediaGalleryUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterDraftReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
  ) {}

  async execute(command: ReorderMediaGalleryCommand) {
    const draft = await this.letterRepository.findDraftById(
      command.creatorId,
      command.letterId,
    )

    if (!draft) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const field = draft.template.definition.fields.find(
      (candidate) => candidate.id === command.fieldId,
    )

    if (!field || field.type !== 'photo-gallery') {
      throw new MediaAssetValidationError(
        `Letter Field is not an image gallery: ${command.fieldId}`,
      )
    }

    if (new Set(command.assetIds).size !== command.assetIds.length) {
      throw new MediaAssetValidationError('Gallery order contains duplicates')
    }

    const currentValue = draft.content[command.fieldId]
    const currentIds = Array.isArray(currentValue)
      ? currentValue.filter(
          (value: unknown): value is string => typeof value === 'string',
        )
      : []

    if (
      currentIds.length !== command.assetIds.length ||
      new Set(currentIds).size !== new Set(command.assetIds).size ||
      currentIds.some((assetId) => !command.assetIds.includes(assetId))
    ) {
      throw new MediaAssetValidationError(
        'Gallery order must include every uploaded photo exactly once',
      )
    }

    const assets = await Promise.all(
      command.assetIds.map((assetId) =>
        this.mediaAssetRepository.findForCreator(
          command.creatorId,
          command.letterId,
          assetId,
        ),
      ),
    )

    if (
      assets.some(
        (asset) =>
          !asset ||
          asset.status !== 'ready' ||
          asset.fieldId !== command.fieldId ||
          asset.kind !== 'photo',
      )
    ) {
      throw new MediaAssetValidationError(
        'Gallery order contains an unavailable photo',
      )
    }

    const content = reorderMediaAssets(
      draft.template,
      draft.content,
      command.fieldId,
      command.assetIds,
    )
    const reorderedAssets = await this.mediaAssetRepository.reorderAndSave({
      creatorId: command.creatorId,
      letterId: command.letterId,
      fieldId: command.fieldId,
      assetIds: command.assetIds,
      content,
    })

    if (!reorderedAssets) {
      throw new MediaAssetValidationError(
        'Gallery order could not be saved. Please try again.',
      )
    }

    return reorderedAssets
  }
}
