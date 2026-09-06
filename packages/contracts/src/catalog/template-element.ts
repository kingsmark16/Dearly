import { z } from 'zod'

export const TemplateTextContentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('static'),
    value: z.string().min(1),
  }),
  z.object({
    kind: z.literal('field'),
    fieldId: z.string().min(1),
  }),
])

const templateElementMetadataSchema = z.object({
  id: z.string().min(1),
})

export const TextTemplateElementSchema = templateElementMetadataSchema.extend({
  type: z.literal('text'),
  heading: z.string().min(1),
  body: TemplateTextContentSchema,
})

export const RevealTemplateElementSchema = templateElementMetadataSchema.extend(
  {
    type: z.literal('reveal'),
    heading: z.string().min(1),
    prompt: z.string().min(1),
    body: TemplateTextContentSchema,
  },
)

export const AudioTemplateElementSchema = templateElementMetadataSchema.extend({
  type: z.literal('audio'),
  fieldId: z.string().min(1),
  label: z.string().min(1),
})

export const PhotoGalleryTemplateElementSchema =
  templateElementMetadataSchema.extend({
    type: z.literal('photo-gallery'),
    fieldId: z.string().min(1),
    heading: z.string().min(1),
  })

export const AnimationTokenSchema = z.enum([
  'hearts',
  'sparkles',
  'petals',
  'confetti',
])

export const AnimationTemplateElementSchema =
  templateElementMetadataSchema.extend({
    type: z.literal('animation'),
    token: AnimationTokenSchema,
    trigger: z.enum(['on-open', 'on-scroll']),
  })

export const TemplateElementSchema = z.discriminatedUnion('type', [
  TextTemplateElementSchema,
  RevealTemplateElementSchema,
  AudioTemplateElementSchema,
  PhotoGalleryTemplateElementSchema,
  AnimationTemplateElementSchema,
])

export type TemplateTextContent = z.infer<typeof TemplateTextContentSchema>
export type TemplateElement = z.infer<typeof TemplateElementSchema>
