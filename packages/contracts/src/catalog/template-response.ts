import { z } from 'zod'
import { TemplateDefinitionSchema } from './template-definition.js'
import { TemplateSummarySchema } from './template.js'

export const TemplateSchema = TemplateSummarySchema.extend({
  definition: TemplateDefinitionSchema,
})

export type Template = z.infer<typeof TemplateSchema>
