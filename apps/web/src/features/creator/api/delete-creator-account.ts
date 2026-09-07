import {
  CreatorAccountDeletionResponseSchema,
  type CreatorAccountDeletionResponse,
} from '@dearly/contracts'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function deleteCreatorAccount(
  confirmation: string,
): Promise<CreatorAccountDeletionResponse> {
  const response = await browserApiClient.delete('/creator/me', {
    data: { confirmation },
  })

  return CreatorAccountDeletionResponseSchema.parse(response.data)
}
