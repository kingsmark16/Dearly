import {
  CreatorMediaAssetSchema,
  type CreatorMediaAsset,
} from '@dearly/contracts/letters/media'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function completeCreatorLetterMediaUpload({
  letterId,
  assetId,
}: {
  letterId: string
  assetId: string
}): Promise<CreatorMediaAsset> {
  const response = await browserApiClient.post(
    `/letters/${encodeURIComponent(letterId)}/media/${encodeURIComponent(assetId)}/complete`,
  )

  return CreatorMediaAssetSchema.parse(response.data)
}
