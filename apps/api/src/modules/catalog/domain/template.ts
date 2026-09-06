import type { CatalogTemplateDefinition } from './template-definition.js'
import type { CatalogTemplateElement } from './template-element.js'

export type CatalogTemplateSeed = {
  slug: string
  name: string
  description: string
  categorySlug: string
  categoryName: string
  version: number
  displayOrder: number
  definition: CatalogTemplateDefinition
}

export type CatalogTemplate = Omit<
  CatalogTemplateSeed,
  'categorySlug' | 'categoryName'
> & {
  category: {
    slug: string
    name: string
  }
}

export class CatalogTemplateNotFoundError extends Error {
  constructor(slug: string) {
    super(`Catalog template not found: ${slug}`)
    this.name = 'CatalogTemplateNotFoundError'
  }
}

function getReferencedFieldIds(element: CatalogTemplateElement): string[] {
  switch (element.type) {
    case 'text':
    case 'reveal':
      return element.body.kind === 'field' ? [element.body.fieldId] : []
    case 'audio':
    case 'photo-gallery':
      return [element.fieldId]
    case 'animation':
      return []
  }
}

export function validateCatalogTemplate(
  template: CatalogTemplateSeed,
): CatalogTemplateSeed {
  const { definition } = template
  const fieldById = new Map(definition.fields.map((field) => [field.id, field]))
  const elementIds = new Set<string>()

  if (fieldById.size !== definition.fields.length) {
    throw new Error(
      `Catalog template has duplicate field IDs: ${template.slug}`,
    )
  }

  for (const element of definition.elements) {
    if (elementIds.has(element.id)) {
      throw new Error(
        `Catalog template has duplicate element IDs: ${template.slug}`,
      )
    }

    elementIds.add(element.id)

    for (const fieldId of getReferencedFieldIds(element)) {
      const field = fieldById.get(fieldId)

      if (!field) {
        throw new Error(
          `Catalog template references missing field ${fieldId}: ${template.slug}`,
        )
      }

      if (element.type === 'audio' && field.type !== 'audio') {
        throw new Error(
          `Audio element must reference an audio field: ${template.slug}`,
        )
      }

      if (element.type === 'photo-gallery' && field.type !== 'photo-gallery') {
        throw new Error(
          `Photo gallery element must reference a photo-gallery field: ${template.slug}`,
        )
      }
    }
  }

  return template
}
