import {
  UpdateDraftInputSchema,
  CreatorLetterDraftSchema,
  type UpdateDraftInput,
} from '@dearly/contracts'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function updateCreatorLetterDraft({
  letterId,
  input,
}: {
  letterId: string
  input: UpdateDraftInput
}) {
  const validInput = UpdateDraftInputSchema.parse(input)
  const response = await browserApiClient.patch(
    `/letters/${encodeURIComponent(letterId)}`,
    validInput,
  )

  return CreatorLetterDraftSchema.parse(response.data)
}
