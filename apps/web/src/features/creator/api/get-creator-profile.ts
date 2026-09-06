import { CreatorProfileSchema, type CreatorProfile } from '@dearly/contracts'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function getCreatorProfile(): Promise<CreatorProfile> {
  const response = await browserApiClient.get('/creator/me')
  return CreatorProfileSchema.parse(response.data)
}
