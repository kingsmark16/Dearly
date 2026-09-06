import {
  CreatorLetterListSchema,
  type CreatorLetterSummary,
} from '@dearly/contracts/letters/creator-letter'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function getCreatorLetters(): Promise<CreatorLetterSummary[]> {
  const response = await browserApiClient.get('/letters')
  return CreatorLetterListSchema.parse(response.data)
}
