import { z } from 'zod'

const categorySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Category slug must be URL-safe')

const templateCategorySchema = z.object({
  slug: categorySlugSchema,
  name: z.string().min(1),
})

export const TemplatePreviewSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  ctaLabel: z.string().min(1),
})

const templateSummaryShape = {
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Template slug must be URL-safe'),
  name: z.string().min(1),
  description: z.string().min(1),
  category: templateCategorySchema,
  version: z.number().int().positive(),
  displayOrder: z.number().int().nonnegative(),
  preview: TemplatePreviewSchema,
}

export const TemplateSummarySchema = z.object(templateSummaryShape)

export const TemplateListSchema = z.array(TemplateSummarySchema)

export type TemplatePreview = z.infer<typeof TemplatePreviewSchema>
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>
