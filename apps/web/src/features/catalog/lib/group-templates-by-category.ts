import type { TemplateSummary } from '@dearly/contracts/catalog/template'

export function groupTemplatesByCategory(templates: TemplateSummary[]) {
  const grouped = new Map<string, TemplateSummary[]>()

  for (const template of templates) {
    const categoryTemplates = grouped.get(template.category.slug) ?? []
    categoryTemplates.push(template)
    grouped.set(template.category.slug, categoryTemplates)
  }

  return grouped
}
