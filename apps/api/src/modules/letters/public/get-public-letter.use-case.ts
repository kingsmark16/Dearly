import { Inject, Injectable, Logger } from '@nestjs/common'
import type { PublishedLetter } from '@dearly/contracts/letters/published-letter'
import {
  PUBLISHED_LETTER_ANALYTICS,
  PUBLISHED_LETTER_READER,
  type PublishedLetterAnalyticsWriter,
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
  private readonly logger = new Logger(GetPublicLetterUseCase.name)

  constructor(
    @Inject(PUBLISHED_LETTER_READER)
    private readonly letterReader: PublishedLetterReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetReader: MediaAssetReader,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
    @Inject(PUBLISHED_LETTER_ANALYTICS)
    private readonly analyticsWriter: PublishedLetterAnalyticsWriter,
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

    const publicLetter = createPublicLetterView(letter, assets, downloadUrls)

    try {
      await this.analyticsWriter.recordView(letter.id)
    } catch (error: unknown) {
      this.logger.warn(
        `Could not record View analytics for Letter ${letter.id}`,
        error instanceof Error ? error.stack : undefined,
      )
    }

    return publicLetter
  }
}
