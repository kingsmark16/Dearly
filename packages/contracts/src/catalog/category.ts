import { z } from 'zod'

export const CategorySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Category slug must be URL-safe')

export const CategorySeedSchema = z.object({
  slug: CategorySlugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  displayOrder: z.number().int().nonnegative(),
})

export const CategorySchema = CategorySeedSchema.extend({
  templateCount: z.number().int().nonnegative(),
})

export const CategoryListSchema = z.array(CategorySchema)

export type CategorySeed = z.infer<typeof CategorySeedSchema>
export type Category = z.infer<typeof CategorySchema>
