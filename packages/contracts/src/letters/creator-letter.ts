import { z } from 'zod'
import { TemplateSchema } from '../catalog/template-response'
import { TemplateSummarySchema } from '../catalog/template'

const isoDateTimeSchema = z.string().datetime()
const creatorLetterStatusSchema = z.enum(['draft', 'published'])
const creatorLetterLifecycleStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
  'trashed',
])
const creatorLetterRestoreStatusSchema = z
  .enum(['draft', 'published', 'archived'])
  .nullable()

export const CreatorLetterSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: creatorLetterLifecycleStatusSchema,
  template: TemplateSummarySchema,
  restoreStatus: creatorLetterRestoreStatusSchema,
  hasPendingRevision: z.boolean(),
  shareUrl: z.string().url().nullable(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: isoDateTimeSchema.nullable(),
  archivedAt: isoDateTimeSchema.nullable(),
  trashedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const CreatorLetterListSchema = z.array(CreatorLetterSummarySchema)

export const LetterLifecycleResponseSchema = z.union([
  CreatorLetterSummarySchema,
  z.object({
    id: z.string().min(1),
    status: z.literal('deleted'),
  }),
])

export const CreatorLetterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: creatorLetterStatusSchema,
  template: TemplateSchema,
  content: z.record(z.string(), z.unknown()),
  hasPendingRevision: z.boolean(),
  shareUrl: z.string().url().nullable(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const CreatorLetterDraftSchema = CreatorLetterSchema

export type CreatorLetterSummary = z.infer<typeof CreatorLetterSummarySchema>
export type LetterLifecycleResponse = z.infer<
  typeof LetterLifecycleResponseSchema
>
export type CreatorLetter = z.infer<typeof CreatorLetterSchema>
export type CreatorLetterDraft = CreatorLetter
