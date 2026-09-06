import { z } from 'zod'
import { TemplateSchema } from '../catalog/template-response'
import { TemplateSummarySchema } from '../catalog/template'

const isoDateTimeSchema = z.string().datetime()

export const CreatorLetterSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.literal('draft'),
  template: TemplateSummarySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const CreatorLetterListSchema = z.array(CreatorLetterSummarySchema)

export const CreatorLetterDraftSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.literal('draft'),
  template: TemplateSchema,
  content: z.record(z.string(), z.unknown()),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export type CreatorLetterSummary = z.infer<typeof CreatorLetterSummarySchema>
export type CreatorLetterDraft = z.infer<typeof CreatorLetterDraftSchema>
