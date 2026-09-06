import {
  CreateDraftInputSchema,
  CreatorLetterDraftSchema,
  type CreateDraftInput,
  type CreatorLetterDraft,
} from '@dearly/contracts'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function createLetterDraft(
  input: CreateDraftInput,
): Promise<CreatorLetterDraft> {
  const validInput = CreateDraftInputSchema.parse(input)
  const response = await browserApiClient.post('/letters', validInput)
  return CreatorLetterDraftSchema.parse(response.data)
}
