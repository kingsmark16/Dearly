import type { CatalogTemplate } from '../../catalog/domain/template.js'
import type { CatalogTemplateField } from '../../catalog/domain/template-field.js'
import type { MediaAssetRecord } from '../media/domain/media-asset.js'
import type { LetterPublishProblem } from './letter.js'

const PHOTO_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const AUDIO_CONTENT_TYPES = new Set([
  'audio/aac',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
])
const DEFAULT_PHOTO_MAX_BYTES = 25 * 1024 * 1024
const DEFAULT_AUDIO_MAX_BYTES = 50 * 1024 * 1024

type PublishableMediaField = CatalogTemplateField

function createProblem(
  field:
    PublishableMediaField | CatalogTemplate['definition']['fields'][number],
  message: string,
): LetterPublishProblem {
  return { fieldId: field.id, fieldLabel: field.label, message }
}

function isTextField(
  field: CatalogTemplate['definition']['fields'][number],
): boolean {
  return (
    field.type === 'text' ||
    field.type === 'rich-text' ||
    field.type === 'recipient-name'
  )
}

function isMediaField(
  field: CatalogTemplate['definition']['fields'][number],
): boolean {
  return (
    field.type === 'photo' ||
    field.type === 'photo-gallery' ||
    field.type === 'audio'
  )
}

function getAssetIds(value: unknown): string[] | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[]
  }

  return value === undefined ? [] : undefined
}

function getMaximumAssetCount(
  template: CatalogTemplate,
  field: PublishableMediaField,
) {
  if (field.type === 'photo' || field.type === 'audio') {
    return 1
  }

  return Math.min(
    field.maxItems ?? template.definition.limits.maxPhotosPerGallery,
    template.definition.limits.maxPhotosPerGallery,
  )
}

function getMaximumBytes(field: PublishableMediaField) {
  if (field.type === 'photo' || field.type === 'photo-gallery') {
    return field.type === 'photo'
      ? (field.maxFileSizeMb ?? 25) * 1024 * 1024
      : DEFAULT_PHOTO_MAX_BYTES
  }

  return DEFAULT_AUDIO_MAX_BYTES
}

function getMaximumDurationSeconds(
  template: CatalogTemplate,
  field: PublishableMediaField,
) {
  if (field.type !== 'audio') {
    return undefined
  }

  return Math.min(
    field.maxDurationSeconds ??
      template.definition.limits.maxAudioDurationSeconds,
    template.definition.limits.maxAudioDurationSeconds,
  )
}

function validateMediaAsset(
  template: CatalogTemplate,
  field: PublishableMediaField,
  asset: MediaAssetRecord | undefined,
): LetterPublishProblem[] {
  if (!asset) {
    return [
      createProblem(
        field,
        `${field.label} refers to media that is no longer available. Upload it again.`,
      ),
    ]
  }

  if (asset.status !== 'ready') {
    return [
      createProblem(
        field,
        `${field.label} is still uploading. Wait for the upload to finish before publishing.`,
      ),
    ]
  }

  const expectedKind = field.type === 'audio' ? 'audio' : 'photo'

  if (asset.fieldId !== field.id || asset.kind !== expectedKind) {
    return [
      createProblem(
        field,
        `${field.label} contains an incompatible media file. Remove it and upload it again.`,
      ),
    ]
  }

  const allowedContentTypes =
    expectedKind === 'photo' ? PHOTO_CONTENT_TYPES : AUDIO_CONTENT_TYPES

  if (!allowedContentTypes.has(asset.contentType)) {
    return [
      createProblem(
        field,
        `${field.label} contains an unsupported file type. Upload a supported file.`,
      ),
    ]
  }

  const maximumBytes = getMaximumBytes(field)

  if (asset.byteSize > maximumBytes) {
    return [
      createProblem(
        field,
        `${field.label} must be ${Math.floor(maximumBytes / (1024 * 1024))} MB or smaller.`,
      ),
    ]
  }

  const maximumDurationSeconds = getMaximumDurationSeconds(template, field)

  if (
    maximumDurationSeconds !== undefined &&
    (asset.durationSeconds === undefined ||
      asset.durationSeconds <= 0 ||
      asset.durationSeconds > maximumDurationSeconds)
  ) {
    return [
      createProblem(
        field,
        `${field.label} must be ${maximumDurationSeconds} seconds or shorter.`,
      ),
    ]
  }

  return []
}

export function validatePublishableLetter(
  template: CatalogTemplate,
  content: Record<string, unknown>,
  assets: MediaAssetRecord[],
): LetterPublishProblem[] {
  const problems: LetterPublishProblem[] = []
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  for (const field of template.definition.fields) {
    const value = content[field.id]

    if (isTextField(field)) {
      if (field.required && (typeof value !== 'string' || !value.trim())) {
        problems.push(
          createProblem(field, `${field.label} is required before publishing.`),
        )
      }

      continue
    }

    if (!isMediaField(field)) {
      continue
    }

    const assetIds = getAssetIds(value)

    if (assetIds === undefined) {
      problems.push(
        createProblem(
          field,
          `${field.label} has an invalid media selection. Upload it again.`,
        ),
      )
      continue
    }

    const maximumAssetCount = getMaximumAssetCount(template, field)

    if (assetIds.length > maximumAssetCount) {
      problems.push(
        createProblem(
          field,
          `${field.label} allows at most ${maximumAssetCount} media asset${maximumAssetCount === 1 ? '' : 's'}.`,
        ),
      )
    }

    if (new Set(assetIds).size !== assetIds.length) {
      problems.push(
        createProblem(field, `${field.label} contains duplicate media files.`),
      )
    }

    const minimumAssetCount =
      field.type === 'photo-gallery' ? (field.minItems ?? 0) : 1
    const minimumAssetLabel = field.type === 'audio' ? 'audio file' : 'photo'

    if (field.required && assetIds.length < minimumAssetCount) {
      problems.push(
        createProblem(
          field,
          `${field.label} is required before publishing. Add at least ${minimumAssetCount} ${minimumAssetLabel}${minimumAssetCount === 1 || field.type === 'audio' ? '' : 's'}.`,
        ),
      )
    } else if (
      !field.required &&
      assetIds.length > 0 &&
      field.type === 'photo-gallery' &&
      assetIds.length < minimumAssetCount
    ) {
      problems.push(
        createProblem(
          field,
          `${field.label} needs at least ${minimumAssetCount} photos when used.`,
        ),
      )
    }

    for (const assetId of assetIds) {
      problems.push(
        ...validateMediaAsset(template, field, assetsById.get(assetId)),
      )
    }
  }

  return problems
}
