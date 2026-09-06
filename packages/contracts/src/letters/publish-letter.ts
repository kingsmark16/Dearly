import { z } from 'zod'

export const PublishLetterResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal('published'),
  shareUrl: z.string().url(),
})

export type PublishLetterResponse = z.infer<typeof PublishLetterResponseSchema>
