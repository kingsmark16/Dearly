import { z } from 'zod'
import { TemplateDefinitionSchema } from './template-definition'
import { TemplateSummarySchema } from './template'

export const TemplateSchema = TemplateSummarySchema.extend({
  definition: TemplateDefinitionSchema,
})

export type Template = z.infer<typeof TemplateSchema>
