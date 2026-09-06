import { Inject, Injectable } from '@nestjs/common'
import type { PublishedLetter } from '@dearly/contracts/letters/published-letter'
import {
  PUBLISHED_LETTER_READER,
  type PublishedLetterReader,
} from '../application/ports/letter-repository.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetReader,
} from '../media/application/ports/media-asset-repository.js'
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../media/application/ports/object-storage.js'
import {
  createPublicLetterView,
  getReferencedMediaAssetIds,
} from './public-letter-view.js'

const PUBLIC_MEDIA_URL_EXPIRY_SECONDS = 15 * 60

@Injectable()
export class GetPublicLetterUseCase {
  constructor(
    @Inject(PUBLISHED_LETTER_READER)
    private readonly letterReader: PublishedLetterReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetReader: MediaAssetReader,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(shareToken: string): Promise<PublishedLetter | undefined> {
    const letter = await this.letterReader.findPublishedByShareToken(shareToken)

    if (!letter) {
      return undefined
    }

    const assets = await this.mediaAssetReader.listForCreator(
      letter.creatorId,
      letter.id,
    )
    const assetById = new Map(assets.map((asset) => [asset.id, asset]))
    const downloadUrls = new Map<string, string>()
    const assetIds = new Set(
      getReferencedMediaAssetIds(letter.template, letter.content),
    )

    await Promise.all(
      [...assetIds].map(async (assetId) => {
        const asset = assetById.get(assetId)

        if (!asset || asset.status !== 'ready') {
          return
        }

        const intent = await this.objectStorage.createDownloadIntent({
          key: asset.objectKey,
          expiresInSeconds: PUBLIC_MEDIA_URL_EXPIRY_SECONDS,
        })
        downloadUrls.set(asset.id, intent.downloadUrl)
      }),
    )

    return createPublicLetterView(letter, assets, downloadUrls)
  }
}
