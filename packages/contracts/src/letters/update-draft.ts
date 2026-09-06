import { z } from 'zod'

export const UpdateDraftInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.record(z.string(), z.unknown()),
})

export type UpdateDraftInput = z.infer<typeof UpdateDraftInputSchema>
