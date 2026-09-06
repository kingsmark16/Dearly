import type { PublishedLetter } from '@dearly/contracts/letters/published-letter'
import type { CatalogTemplate } from '../../catalog/domain/template.js'
import type { LetterPublishedRecord } from '../domain/letter.js'
import type { MediaAssetRecord } from '../media/domain/media-asset.js'

function getField(template: CatalogTemplate, fieldId: string) {
  return template.definition.fields.find((field) => field.id === fieldId)
}

function getTextValue(content: Record<string, unknown>, fieldId: string) {
  const value = content[fieldId]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function getAssetIds(value: unknown) {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter(
      (assetId): assetId is string => typeof assetId === 'string',
    )
  }

  return []
}

export function getReferencedMediaAssetIds(
  template: CatalogTemplate,
  content: Record<string, unknown>,
) {
  return template.definition.fields.flatMap((field) => {
    if (
      field.type !== 'photo' &&
      field.type !== 'photo-gallery' &&
      field.type !== 'audio'
    ) {
      return []
    }

    return getAssetIds(content[field.id])
  })
}

export function createPublicLetterView(
  letter: LetterPublishedRecord,
  assets: MediaAssetRecord[],
  downloadUrls: ReadonlyMap<string, string>,
): PublishedLetter {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const elements: PublishedLetter['elements'] = []

  for (const element of letter.template.definition.elements) {
    if (element.type === 'text' || element.type === 'reveal') {
      const body =
        element.body.kind === 'static'
          ? element.body.value
          : getTextValue(letter.content, element.body.fieldId)

      if (body) {
        elements.push(
          element.type === 'text'
            ? {
                id: element.id,
                type: 'text',
                heading: element.heading,
                body,
              }
            : {
                id: element.id,
                type: 'reveal',
                heading: element.heading,
                prompt: element.prompt,
                body,
              },
        )
      }

      continue
    }

    if (element.type === 'animation') {
      elements.push({
        id: element.id,
        type: 'animation',
        token: element.token,
        trigger: element.trigger,
      })
      continue
    }

    const field = getField(letter.template, element.fieldId)
    const assetIds = getAssetIds(letter.content[element.fieldId])

    if (element.type === 'audio') {
      if (!field || field.type !== 'audio') {
        continue
      }

      const [assetId] = assetIds
      const asset = assetId ? assetsById.get(assetId) : undefined
      const url = asset ? downloadUrls.get(asset.id) : undefined

      if (!asset || asset.status !== 'ready' || !url) {
        continue
      }

      elements.push({
        id: element.id,
        type: 'audio',
        label: element.label,
        url,
      })
      continue
    }

    if (!field || field.type !== 'photo-gallery') {
      continue
    }

    const photos = assetIds.flatMap((assetId) => {
      const asset = assetsById.get(assetId)
      const url = asset ? downloadUrls.get(asset.id) : undefined

      if (!asset || asset.status !== 'ready' || !url) {
        return []
      }

      return [
        {
          id: asset.id,
          url,
          alt: asset.originalFileName,
        },
      ]
    })

    if (photos.length > 0) {
      elements.push({
        id: element.id,
        type: 'photo-gallery',
        heading: element.heading,
        photos,
      })
    }
  }

  return {
    slug: letter.shareToken,
    category: letter.template.category.name,
    templateName: letter.template.name,
    opening: letter.template.definition.openingScreen,
    elements,
  }
}
