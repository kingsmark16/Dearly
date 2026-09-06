import { MediaAssetValidationError } from './media-asset.js'
import type { CatalogTemplate } from '../../../catalog/domain/template.js'

export function contentReferencesMediaAsset(
  content: Record<string, unknown>,
  assetId: string,
) {
  return Object.values(content).some((value) => {
    if (value === assetId) {
      return true
    }

    return (
      Array.isArray(value) && value.some((candidate) => candidate === assetId)
    )
  })
}

function getMediaField(
  template: CatalogTemplate,
  fieldId: string,
): (typeof template.definition.fields)[number] {
  const field = template.definition.fields.find(
    (candidate) => candidate.id === fieldId,
  )

  if (!field) {
    throw new MediaAssetValidationError(`Unknown Letter Field: ${fieldId}`)
  }

  if (
    field.type !== 'photo' &&
    field.type !== 'photo-gallery' &&
    field.type !== 'audio'
  ) {
    throw new MediaAssetValidationError(
      `Letter Field does not accept media: ${fieldId}`,
    )
  }

  return field
}

export function attachMediaAsset(
  template: CatalogTemplate,
  content: Record<string, unknown>,
  fieldId: string,
  assetId: string,
) {
  const field = getMediaField(template, fieldId)
  const nextContent = { ...content }

  if (field.type === 'photo-gallery') {
    const currentValue = content[fieldId]
    const assetIds = Array.isArray(currentValue)
      ? currentValue.filter(
          (value): value is string => typeof value === 'string',
        )
      : []

    if (!assetIds.includes(assetId)) {
      assetIds.push(assetId)
    }

    nextContent[fieldId] = assetIds
  } else {
    nextContent[fieldId] = assetId
  }

  return nextContent
}

export function detachMediaAsset(
  template: CatalogTemplate,
  content: Record<string, unknown>,
  fieldId: string,
  assetId: string,
) {
  const field = getMediaField(template, fieldId)
  const nextContent = { ...content }

  if (field.type === 'photo-gallery') {
    const currentValue = content[fieldId]
    const assetIds = Array.isArray(currentValue)
      ? currentValue.filter(
          (value): value is string =>
            typeof value === 'string' && value !== assetId,
        )
      : []

    if (assetIds.length === 0) {
      delete nextContent[fieldId]
    } else {
      nextContent[fieldId] = assetIds
    }
  } else if (content[fieldId] === assetId) {
    delete nextContent[fieldId]
  }

  return nextContent
}

export function reorderMediaAssets(
  template: CatalogTemplate,
  content: Record<string, unknown>,
  fieldId: string,
  assetIds: string[],
) {
  const field = getMediaField(template, fieldId)

  if (field.type !== 'photo-gallery') {
    throw new MediaAssetValidationError(
      `Letter Field is not an image gallery: ${fieldId}`,
    )
  }

  return { ...content, [fieldId]: [...assetIds] }
}
