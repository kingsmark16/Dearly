import { z } from 'zod'
import { TemplateSchema } from '../catalog/template-response'
import { TemplateSummarySchema } from '../catalog/template'

const isoDateTimeSchema = z.string().datetime()
const creatorLetterStatusSchema = z.enum(['draft', 'published'])

export const CreatorLetterSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: creatorLetterStatusSchema,
  template: TemplateSummarySchema,
  hasPendingRevision: z.boolean(),
  shareUrl: z.string().url().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const CreatorLetterListSchema = z.array(CreatorLetterSummarySchema)

export const CreatorLetterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: creatorLetterStatusSchema,
  template: TemplateSchema,
  content: z.record(z.string(), z.unknown()),
  hasPendingRevision: z.boolean(),
  shareUrl: z.string().url().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const CreatorLetterDraftSchema = CreatorLetterSchema

export type CreatorLetterSummary = z.infer<typeof CreatorLetterSummarySchema>
export type CreatorLetter = z.infer<typeof CreatorLetterSchema>
export type CreatorLetterDraft = CreatorLetter
