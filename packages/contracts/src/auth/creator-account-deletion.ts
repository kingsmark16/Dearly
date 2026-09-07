import { z } from 'zod'

export const CreatorAccountDeletionResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal('deleted'),
})

export type CreatorAccountDeletionResponse = z.infer<
  typeof CreatorAccountDeletionResponseSchema
>
