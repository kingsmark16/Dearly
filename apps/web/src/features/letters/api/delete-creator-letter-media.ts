import {
  CreatorMediaAssetSchema,
  type CreatorMediaAsset,
} from '@dearly/contracts/letters/media'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function deleteCreatorLetterMedia({
  letterId,
  assetId,
}: {
  letterId: string
  assetId: string
}): Promise<CreatorMediaAsset> {
  const response = await browserApiClient.delete(
    `/letters/${encodeURIComponent(letterId)}/media/${encodeURIComponent(assetId)}`,
  )

  return CreatorMediaAssetSchema.parse(response.data)
}
