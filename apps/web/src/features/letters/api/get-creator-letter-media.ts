import {
  CreatorMediaAssetListSchema,
  type CreatorMediaAsset,
} from '@dearly/contracts/letters/media'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function getCreatorLetterMedia(
  letterId: string,
): Promise<CreatorMediaAsset[]> {
  const response = await browserApiClient.get(
    `/letters/${encodeURIComponent(letterId)}/media`,
  )

  return CreatorMediaAssetListSchema.parse(response.data)
}
