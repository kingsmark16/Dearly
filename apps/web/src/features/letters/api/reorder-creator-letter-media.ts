import {
  CreatorMediaAssetListSchema,
  ReorderMediaGalleryInputSchema,
  type CreatorMediaAsset,
} from '@dearly/contracts/letters/media'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function reorderCreatorLetterMedia({
  letterId,
  fieldId,
  assetIds,
}: {
  letterId: string
  fieldId: string
  assetIds: string[]
}): Promise<CreatorMediaAsset[]> {
  const validInput = ReorderMediaGalleryInputSchema.parse({ assetIds })
  const response = await browserApiClient.patch(
    `/letters/${encodeURIComponent(letterId)}/media/${encodeURIComponent(fieldId)}/order`,
    validInput,
  )

  return CreatorMediaAssetListSchema.parse(response.data)
}
