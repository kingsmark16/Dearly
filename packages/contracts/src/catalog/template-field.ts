import { z } from 'zod'

const templateFieldMetadataSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  required: z.boolean(),
})

export const TextTemplateFieldSchema = templateFieldMetadataSchema.extend({
  type: z.literal('text'),
  maxLength: z.number().int().positive().max(10_000),
})

export const RichTextTemplateFieldSchema = templateFieldMetadataSchema.extend({
  type: z.literal('rich-text'),
  maxLength: z.number().int().positive().max(50_000),
})

export const RecipientNameTemplateFieldSchema =
  templateFieldMetadataSchema.extend({
    type: z.literal('recipient-name'),
  })

export const PhotoTemplateFieldSchema = templateFieldMetadataSchema.extend({
  type: z.literal('photo'),
  maxFileSizeMb: z.number().positive().max(25),
})

export const PhotoGalleryTemplateFieldSchema =
  templateFieldMetadataSchema.extend({
    type: z.literal('photo-gallery'),
    minItems: z.number().int().nonnegative().max(100),
    maxItems: z.number().int().positive().max(100),
  })

export const AudioTemplateFieldSchema = templateFieldMetadataSchema.extend({
  type: z.literal('audio'),
  maxDurationSeconds: z
    .number()
    .int()
    .positive()
    .max(60 * 60),
})

export const TemplateFieldSchema = z.discriminatedUnion('type', [
  TextTemplateFieldSchema,
  RichTextTemplateFieldSchema,
  RecipientNameTemplateFieldSchema,
  PhotoTemplateFieldSchema,
  PhotoGalleryTemplateFieldSchema,
  AudioTemplateFieldSchema,
])

export type TemplateField = z.infer<typeof TemplateFieldSchema>
