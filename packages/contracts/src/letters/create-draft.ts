import { z } from 'zod'

const templateSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Template slug must be URL-safe')

export const CreateDraftInputSchema = z.object({
  templateSlug: templateSlugSchema,
  title: z.string().trim().min(1).max(120).optional(),
})

export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>
