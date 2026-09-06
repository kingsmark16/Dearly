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

export type LetterPublishedRecord = {
  id: string
  creatorId: string
  title: string
  status: 'published'
  template: CatalogTemplate
  content: Record<string, unknown>
  pendingContent: Record<string, unknown> | null
  shareToken: string
  createdAt: Date
  updatedAt: Date
}

export type CreatorLetterRecord = LetterDraftRecord | LetterPublishedRecord

export type CreateLetterDraftRecord = {
  creatorId: string
  title: string
  template: CatalogTemplate
}

export type UpdateLetterRecord = {
  creatorId: string
  letterId: string
  title: string
  content: Record<string, unknown>
}

export type UpdateLetterDraftRecord = UpdateLetterRecord

export function getEditableLetterContent(letter: CreatorLetterRecord) {
  if (letter.status === 'published') {
    return letter.pendingContent ?? letter.content
  }

  return letter.content
}

export class LetterNotFoundError extends Error {
  constructor(letterId: string) {
    super(`Letter not found: ${letterId}`)
    this.name = 'LetterNotFoundError'
  }
}

export class LetterDraftNotFoundError extends Error {
  constructor(letterId: string) {
    super(`Letter Draft not found: ${letterId}`)
    this.name = 'LetterDraftNotFoundError'
  }
}

export class LetterDraftValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LetterDraftValidationError'
  }
}

export type LetterPublishProblem = {
  fieldId: string
  fieldLabel: string
  message: string
}

export class LetterPublishValidationError extends Error {
  constructor(readonly problems: LetterPublishProblem[]) {
    super('Letter cannot be published until the listed problems are fixed')
    this.name = 'LetterPublishValidationError'
  }
}

function isEditableFieldType(type: string) {
  return type === 'text' || type === 'rich-text' || type === 'recipient-name'
}

function isMediaFieldType(type: string) {
  return type === 'photo' || type === 'photo-gallery' || type === 'audio'
}

function isMediaReferenceValue(
  field: CatalogTemplate['definition']['fields'][number],
  value: unknown,
) {
  if (field.type === 'photo-gallery') {
    return (
      Array.isArray(value) &&
      value.every(
        (assetId) => typeof assetId === 'string' && assetId.length > 0,
      )
    )
  }

  return typeof value === 'string' && value.length > 0
}

function hasSameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function validateLetterDraftTitle(title: string) {
  const normalizedTitle = title.trim()

  if (!normalizedTitle) {
    throw new LetterDraftValidationError('Letter Draft title is required')
  }

  if (normalizedTitle.length > 120) {
    throw new LetterDraftValidationError(
      'Letter Draft title must be 120 characters or fewer',
    )
  }

  return normalizedTitle
}

export function validateLetterDraftContent(
  template: CatalogTemplate,
  content: Record<string, unknown>,
  existingContent: Record<string, unknown> = {},
) {
  const fieldById = new Map(
    template.definition.fields.map((field) => [field.id, field]),
  )
  const validatedContent: Record<string, unknown> = {}

  for (const field of template.definition.fields) {
    if (
      isMediaFieldType(field.type) &&
      existingContent[field.id] !== undefined
    ) {
      if (!isMediaReferenceValue(field, existingContent[field.id])) {
        throw new LetterDraftValidationError(
          `Letter media Field has an invalid value: ${field.id}`,
        )
      }

      validatedContent[field.id] = existingContent[field.id]
    }
  }

  for (const [fieldId, value] of Object.entries(content)) {
    const field = fieldById.get(fieldId)

    if (!field) {
      throw new LetterDraftValidationError(`Unknown Letter Field: ${fieldId}`)
    }

    if (isMediaFieldType(field.type)) {
      if (!isMediaReferenceValue(field, value)) {
        throw new LetterDraftValidationError(
          `Letter media Field has an invalid value: ${fieldId}`,
        )
      }

      if (!hasSameValue(value, existingContent[fieldId])) {
        throw new LetterDraftValidationError(
          `Letter media Field must be changed through media operations: ${fieldId}`,
        )
      }

      validatedContent[fieldId] = value
      continue
    }

    if (!isEditableFieldType(field.type)) {
      throw new LetterDraftValidationError(
        `Letter Field is not editable yet: ${fieldId}`,
      )
    }

    if (typeof value !== 'string') {
      throw new LetterDraftValidationError(
        `Letter Field must be text: ${fieldId}`,
      )
    }

    const maxLength =
      field.maxLength ?? (field.type === 'recipient-name' ? 120 : undefined)

    if (maxLength !== undefined && value.length > maxLength) {
      throw new LetterDraftValidationError(
        `Letter Field is too long: ${fieldId}`,
      )
    }

    validatedContent[fieldId] = value
  }

  return validatedContent
}
