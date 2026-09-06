import type { CatalogTemplate } from '../../catalog/domain/template.js'

export type LetterDraftRecord = {
  id: string
  creatorId: string
  title: string
  status: 'draft'
  template: CatalogTemplate
  content: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type CreateLetterDraftRecord = {
  creatorId: string
  title: string
  template: CatalogTemplate
}
