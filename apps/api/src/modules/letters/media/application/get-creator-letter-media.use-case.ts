import { Inject, Injectable } from '@nestjs/common'
import {
  LETTER_REPOSITORY,
  type LetterDraftReader,
} from '../../application/ports/letter-repository.js'
import {
  LetterDraftNotFoundError,
  type LetterDraftRecord,
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

function orderAssetsByDraftContent(
  draft: LetterDraftRecord,
  assets: MediaAssetRecord[],
) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const orderedAssets: MediaAssetRecord[] = []
  const addedAssetIds = new Set<string>()

  for (const field of draft.template.definition.fields) {
    const value = draft.content[field.id]
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

  return [
    ...orderedAssets,
    ...assets.filter((asset) => !addedAssetIds.has(asset.id)),
  ]
}

@Injectable()
export class GetCreatorLetterMediaUseCase {
  constructor(
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterDraftReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(
    creatorId: string,
    letterId: string,
  ): Promise<CreatorMediaAssetView[]> {
    const draft = await this.letterRepository.findDraftById(creatorId, letterId)

    if (!draft) {
      throw new LetterDraftNotFoundError(letterId)
    }

    const assets = await this.mediaAssetRepository.listForCreator(
      creatorId,
      letterId,
    )

    return Promise.all(
      orderAssetsByDraftContent(draft, assets).map(async (asset) => {
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
