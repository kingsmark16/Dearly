import { z } from 'zod'
import { TemplateElementSchema } from './template-element.js'
import { TemplateFieldSchema } from './template-field.js'

export const TemplateOpeningScreenSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  ctaLabel: z.string().min(1),
})

export const TemplateLimitsSchema = z.object({
  maxPhotosPerGallery: z.number().int().positive().max(100),
  maxAudioDurationSeconds: z
    .number()
    .int()
    .positive()
    .max(60 * 60),
})

export const TemplateDefinitionSchema = z.object({
  openingScreen: TemplateOpeningScreenSchema,
  fields: z.array(TemplateFieldSchema).min(1),
  elements: z.array(TemplateElementSchema).min(1),
  limits: TemplateLimitsSchema,
})

export type TemplateOpeningScreen = z.infer<typeof TemplateOpeningScreenSchema>
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>
