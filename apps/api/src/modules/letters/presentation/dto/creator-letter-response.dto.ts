import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import {
  getEditableLetterContent,
  type CreatorLetterLifecycleRecord,
  type CreatorLetterRecord,
  type LetterRestoreStatus,
} from '../../domain/letter.js'

export type CreatorLetterSummaryResponse = {
  id: string
  title: string
  status: CreatorLetterLifecycleRecord['status']
  template: TemplateSummary
  restoreStatus: LetterRestoreStatus | null
  hasPendingRevision: boolean
  shareUrl: string | null
  viewCount: number
  lastViewedAt: string | null
  archivedAt: string | null
  trashedAt: string | null
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
  viewCount: number
  lastViewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreatorLetterDraftResponse = CreatorLetterResponse

function toTemplateSummary(
  template: CreatorLetterLifecycleRecord['template'],
): TemplateSummary {
  return {
    slug: template.slug,
    name: template.name,
    description: template.description,
    category: template.category,
    version: template.version,
    displayOrder: template.displayOrder,
    preview: template.definition.openingScreen,
  }
}

function getRestoreStatus(letter: CreatorLetterLifecycleRecord) {
  return letter.status === 'archived' || letter.status === 'trashed'
    ? letter.restoreStatus
    : null
}

function getArchivedAt(letter: CreatorLetterLifecycleRecord) {
  return letter.status === 'archived' ? letter.archivedAt.toISOString() : null
}

function getTrashedAt(letter: CreatorLetterLifecycleRecord) {
  return letter.status === 'trashed' ? letter.trashedAt.toISOString() : null
}

function getViewCount(letter: CreatorLetterLifecycleRecord) {
  return letter.status === 'published' ? letter.viewCount : 0
}

function getLastViewedAt(letter: CreatorLetterLifecycleRecord) {
  return letter.status === 'published' && letter.lastViewedAt
    ? letter.lastViewedAt.toISOString()
    : null
}

export function toCreatorLetterSummaryResponse(
  letter: CreatorLetterLifecycleRecord,
  shareUrl: string | null,
): CreatorLetterSummaryResponse {
  return {
    id: letter.id,
    title: letter.title,
    status: letter.status,
    template: toTemplateSummary(letter.template),
    restoreStatus: getRestoreStatus(letter),
    hasPendingRevision:
      letter.status === 'published' && letter.pendingContent !== null,
    shareUrl,
    viewCount: getViewCount(letter),
    lastViewedAt: getLastViewedAt(letter),
    archivedAt: getArchivedAt(letter),
    trashedAt: getTrashedAt(letter),
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
    viewCount: letter.status === 'published' ? letter.viewCount : 0,
    lastViewedAt:
      letter.status === 'published' && letter.lastViewedAt
        ? letter.lastViewedAt.toISOString()
        : null,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}
