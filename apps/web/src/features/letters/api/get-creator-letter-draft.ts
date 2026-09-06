import {
  CreatorLetterDraftSchema,
  type CreatorLetterDraft,
} from '@dearly/contracts/letters/creator-letter'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function getCreatorLetterDraft(
  letterId: string,
): Promise<CreatorLetterDraft> {
  const response = await browserApiClient.get(
    `/letters/${encodeURIComponent(letterId)}`,
  )

  return CreatorLetterDraftSchema.parse(response.data)
}
