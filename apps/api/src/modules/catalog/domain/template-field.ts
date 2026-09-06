export type CatalogTemplateField = {
  id: string
  type:
    | 'text'
    | 'rich-text'
    | 'recipient-name'
    | 'photo'
    | 'photo-gallery'
    | 'audio'
  label: string
  description?: string
  required: boolean
  maxLength?: number
  maxFileSizeMb?: number
  minItems?: number
  maxItems?: number
  maxDurationSeconds?: number
}
