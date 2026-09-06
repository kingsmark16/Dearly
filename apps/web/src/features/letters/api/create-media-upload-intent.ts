import {
  CreateMediaUploadIntentInputSchema,
  MediaUploadIntentSchema,
  type CreateMediaUploadIntentInput,
  type MediaUploadIntent,
} from '@dearly/contracts/letters/media'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function createMediaUploadIntent({
  letterId,
  input,
}: {
  letterId: string
  input: CreateMediaUploadIntentInput
}): Promise<MediaUploadIntent> {
  const validInput = CreateMediaUploadIntentInputSchema.parse(input)
  const response = await browserApiClient.post(
    `/letters/${encodeURIComponent(letterId)}/media/upload-intents`,
    validInput,
  )

  return MediaUploadIntentSchema.parse(response.data)
}
