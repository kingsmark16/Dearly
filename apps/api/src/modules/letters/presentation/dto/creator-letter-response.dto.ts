import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import {
  getEditableLetterContent,
  type CreatorLetterRecord,
} from '../../domain/letter.js'

export type CreatorLetterSummaryResponse = {
  id: string
  title: string
  status: CreatorLetterRecord['status']
  template: TemplateSummary
  hasPendingRevision: boolean
  shareUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreatorLetterResponse = {
  id: string
  title: string
  status: CreatorLetterRecord['status']
  template: CreatorLetterRecord['template']
  content: Record<string, unknown>
  hasPendingRevision: boolean
  shareUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreatorLetterDraftResponse = CreatorLetterResponse

function toTemplateSummary(
  template: CreatorLetterRecord['template'],
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
  letter: CreatorLetterRecord,
  shareUrl: string | null,
): CreatorLetterSummaryResponse {
  return {
    id: letter.id,
    title: letter.title,
    status: letter.status,
    template: toTemplateSummary(letter.template),
    hasPendingRevision:
      letter.status === 'published' && letter.pendingContent !== null,
    shareUrl,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}

export function toCreatorLetterDraftResponse(
  letter: CreatorLetterRecord,
  shareUrl: string | null,
): CreatorLetterResponse {
  return {
    id: letter.id,
    title: letter.title,
    status: letter.status,
    template: letter.template,
    content: getEditableLetterContent(letter),
    hasPendingRevision:
      letter.status === 'published' && letter.pendingContent !== null,
    shareUrl,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}
