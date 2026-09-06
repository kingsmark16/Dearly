import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import type { LetterDraftRecord } from '../../domain/letter.js'

export type CreatorLetterSummaryResponse = {
  id: string
  title: string
  status: 'draft'
  template: TemplateSummary
  createdAt: string
  updatedAt: string
}

export type CreatorLetterDraftResponse = {
  id: string
  title: string
  status: 'draft'
  template: LetterDraftRecord['template']
  content: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function toTemplateSummary(
  template: LetterDraftRecord['template'],
): TemplateSummary {
  return {
    slug: template.slug,
    name: template.name,
    description: template.description,
    category: template.category,
    version: template.version,
    displayOrder: template.displayOrder,
  }
}

export function toCreatorLetterSummaryResponse(
  letter: LetterDraftRecord,
): CreatorLetterSummaryResponse {
  return {
    id: letter.id,
    title: letter.title,
    status: letter.status,
    template: toTemplateSummary(letter.template),
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}

export function toCreatorLetterDraftResponse(
  letter: LetterDraftRecord,
): CreatorLetterDraftResponse {
  return {
    id: letter.id,
    title: letter.title,
    status: letter.status,
    template: letter.template,
    content: letter.content,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}
