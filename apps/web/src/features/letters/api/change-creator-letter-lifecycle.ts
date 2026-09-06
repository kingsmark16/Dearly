import {
  LetterLifecycleResponseSchema,
  type LetterLifecycleResponse,
} from '@dearly/contracts/letters/creator-letter'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export type CreatorLetterLifecycleAction = 'archive' | 'restore' | 'trash'

export async function changeCreatorLetterLifecycle({
  letterId,
  action,
  confirmation,
}: {
  letterId: string
  action: CreatorLetterLifecycleAction | 'permanent-delete'
  confirmation?: string
}): Promise<LetterLifecycleResponse> {
  const url = `/letters/${encodeURIComponent(letterId)}/${action}`
  const response =
    action === 'permanent-delete'
      ? await browserApiClient.post(url, { confirmation })
      : await browserApiClient.post(url)

  return LetterLifecycleResponseSchema.parse(response.data)
}
