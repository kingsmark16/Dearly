import { z } from 'zod'

export const CreatorProfileSchema = z.object({
  creator: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    emailVerified: z.literal(true),
  }),
})

export type CreatorProfile = z.infer<typeof CreatorProfileSchema>
