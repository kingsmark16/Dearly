import type { Category } from '@dearly/contracts/catalog/category'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import type { CatalogTemplate } from '../../domain/template.js'

export const CATALOG_REPOSITORY = Symbol('CATALOG_REPOSITORY')

export interface CatalogRepository {
  listCategories(): Promise<Category[]>
  listTemplates(categorySlug?: string): Promise<TemplateSummary[]>
  findTemplateBySlug(slug: string): Promise<CatalogTemplate | undefined>
}
