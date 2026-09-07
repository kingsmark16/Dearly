import { CategorySeedSchema } from '@dearly/contracts/catalog/category'
import type { Category } from '@dearly/contracts/catalog/category'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import {
  CatalogCategoryNotFoundError,
  type CatalogCategorySeed,
} from '../domain/category.js'
import type { CatalogRepository } from '../application/ports/catalog-repository.js'
import {
  type CatalogTemplate,
  type CatalogTemplateSeed,
  validateCatalogTemplate,
} from '../domain/template.js'
import { catalogCategories, catalogTemplates } from './seed/catalog-seed.js'

function toTemplateSummary(
  template: CatalogTemplateSeed,
  category: CatalogCategorySeed,
): TemplateSummary {
  return {
    slug: template.slug,
    name: template.name,
    description: template.description,
    category: {
      slug: category.slug,
      name: category.name,
    },
    version: template.version,
    displayOrder: template.displayOrder,
    preview: template.definition.openingScreen,
  }
}

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly categories: CatalogCategorySeed[]
  private readonly templates: CatalogTemplateSeed[]
  private readonly categoryBySlug: Map<string, CatalogCategorySeed>
  private readonly templateBySlug: Map<string, CatalogTemplateSeed>

  constructor() {
    this.categories = catalogCategories.map((category) =>
      CategorySeedSchema.parse(category),
    )
    this.templates = catalogTemplates.map(validateCatalogTemplate)
    this.categoryBySlug = new Map()
    this.templateBySlug = new Map()

    for (const category of this.categories) {
      if (this.categoryBySlug.has(category.slug)) {
        throw new Error(`Duplicate catalog category slug: ${category.slug}`)
      }

      this.categoryBySlug.set(category.slug, category)
    }

    for (const template of this.templates) {
      const category = this.categoryBySlug.get(template.categorySlug)

      if (!category) {
        throw new Error(
          `Catalog template references missing category: ${template.slug}`,
        )
      }

      if (category.name !== template.categoryName) {
        throw new Error(
          `Catalog template category name does not match its category: ${template.slug}`,
        )
      }

      if (this.templateBySlug.has(template.slug)) {
        throw new Error(`Duplicate catalog template slug: ${template.slug}`)
      }

      this.templateBySlug.set(template.slug, template)
    }
  }

  async listCategories(): Promise<Category[]> {
    return [...this.categories]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((category) => ({
        ...category,
        templateCount: this.templates.filter(
          (template) => template.categorySlug === category.slug,
        ).length,
      }))
  }

  async listTemplates(categorySlug?: string): Promise<TemplateSummary[]> {
    const category = categorySlug
      ? this.categoryBySlug.get(categorySlug)
      : undefined

    if (categorySlug && !category) {
      throw new CatalogCategoryNotFoundError(categorySlug)
    }

    return this.templates
      .filter(
        (template) => !categorySlug || template.categorySlug === categorySlug,
      )
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((template) =>
        toTemplateSummary(
          template,
          category ?? this.categoryBySlug.get(template.categorySlug)!,
        ),
      )
  }

  async findTemplateBySlug(slug: string): Promise<CatalogTemplate | undefined> {
    const template = this.templateBySlug.get(slug)

    if (!template) {
      return undefined
    }

    const category = this.categoryBySlug.get(template.categorySlug)

    if (!category) {
      throw new Error(`Catalog template references missing category: ${slug}`)
    }

    return {
      slug: template.slug,
      name: template.name,
      description: template.description,
      version: template.version,
      displayOrder: template.displayOrder,
      category: {
        slug: category.slug,
        name: category.name,
      },
      preview: template.definition.openingScreen,
      definition: template.definition,
    }
  }
}
