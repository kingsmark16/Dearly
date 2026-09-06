import { Inject, Injectable } from '@nestjs/common'
import {
  CREATOR_LETTER_READER,
  type LetterOwnerReader,
} from '../../application/ports/letter-repository.js'
import {
  getEditableLetterContent,
  LetterDraftNotFoundError,
  type CreatorLetterRecord,
} from '../../domain/letter.js'
import type { MediaAssetRecord } from '../domain/media-asset.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetRepository,
} from './ports/media-asset-repository.js'
import { OBJECT_STORAGE, type ObjectStorage } from './ports/object-storage.js'

const DOWNLOAD_INTENT_EXPIRY_SECONDS = 15 * 60

export type CreatorMediaAssetView = MediaAssetRecord & {
  previewUrl: string | null
}

function orderAssetsByLetterContent(
  letter: CreatorLetterRecord,
  assets: MediaAssetRecord[],
) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const orderedAssets: MediaAssetRecord[] = []
  const addedAssetIds = new Set<string>()
  const content = getEditableLetterContent(letter)

  for (const field of letter.template.definition.fields) {
    const value = content[field.id]
    const assetIds =
      typeof value === 'string'
        ? [value]
        : Array.isArray(value)
          ? value.filter(
              (assetId): assetId is string => typeof assetId === 'string',
            )
          : []

    for (const assetId of assetIds) {
      const asset = assetById.get(assetId)

      if (asset && !addedAssetIds.has(asset.id)) {
        orderedAssets.push(asset)
        addedAssetIds.add(asset.id)
      }
    }
  }

  return orderedAssets
}

@Injectable()
export class GetCreatorLetterMediaUseCase {
  constructor(
    @Inject(CREATOR_LETTER_READER)
    private readonly letterRepository: LetterOwnerReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(
    creatorId: string,
    letterId: string,
  ): Promise<CreatorMediaAssetView[]> {
    const letter = await this.letterRepository.findByIdForCreator(
      creatorId,
      letterId,
    )

    if (!letter) {
      throw new LetterDraftNotFoundError(letterId)
    }

    const assets = await this.mediaAssetRepository.listForCreator(
      creatorId,
      letterId,
    )

    return Promise.all(
      orderAssetsByLetterContent(letter, assets).map(async (asset) => {
        if (asset.status === 'pending') {
          return { ...asset, previewUrl: null }
        }

        const intent = await this.objectStorage.createDownloadIntent({
          key: asset.objectKey,
          expiresInSeconds: DOWNLOAD_INTENT_EXPIRY_SECONDS,
        })

        return { ...asset, previewUrl: intent.downloadUrl }
      }),
    )
  }
}
