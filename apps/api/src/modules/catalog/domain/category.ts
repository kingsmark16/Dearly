import type { CategorySeed } from '@dearly/contracts/catalog/category'

export type CatalogCategorySeed = CategorySeed

export class CatalogCategoryNotFoundError extends Error {
  constructor(slug: string) {
    super(`Catalog category not found: ${slug}`)
    this.name = 'CatalogCategoryNotFoundError'
  }
}
