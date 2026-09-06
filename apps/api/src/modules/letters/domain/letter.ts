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

export type UpdateLetterDraftRecord = {
  creatorId: string
  letterId: string
  title: string
  content: Record<string, unknown>
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

function isEditableFieldType(type: string) {
  return type === 'text' || type === 'rich-text' || type === 'recipient-name'
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
) {
  const fieldById = new Map(
    template.definition.fields.map((field) => [field.id, field]),
  )
  const validatedContent: Record<string, unknown> = {}

  for (const [fieldId, value] of Object.entries(content)) {
    const field = fieldById.get(fieldId)

    if (!field) {
      throw new LetterDraftValidationError(`Unknown Letter Field: ${fieldId}`)
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
