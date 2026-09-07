import {
  PublishLetterResponseSchema,
  type PublishLetterResponse,
} from '@dearly/contracts/letters/publish-letter'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function regenerateCreatorLetterShareLink(
  letterId: string,
): Promise<PublishLetterResponse> {
  const response = await browserApiClient.post(
    `/letters/${encodeURIComponent(letterId)}/regenerate-link`,
  )

  return PublishLetterResponseSchema.parse(response.data)
}
