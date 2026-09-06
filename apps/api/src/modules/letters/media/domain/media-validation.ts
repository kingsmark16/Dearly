import type { CatalogTemplate } from '../../../catalog/domain/template.js'
import { MediaAssetValidationError } from './media-asset.js'

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

export type MediaUploadRequest = {
  fieldId: string
  fileName: string
  contentType: string
  byteSize: number
  durationSeconds?: number
}

export type ValidatedMediaUpload = MediaUploadRequest & {
  kind: 'photo' | 'audio'
  normalizedFileName: string
}

function getField(template: CatalogTemplate, fieldId: string) {
  const field = template.definition.fields.find(
    (candidate) => candidate.id === fieldId,
  )

  if (!field) {
    throw new MediaAssetValidationError(`Unknown Letter Field: ${fieldId}`)
  }

  return field
}

function getMaxCount(
  template: CatalogTemplate,
  field: (typeof template.definition.fields)[number],
) {
  switch (field.type) {
    case 'photo':
    case 'audio':
      return 1
    case 'photo-gallery':
      return Math.min(
        field.maxItems ?? template.definition.limits.maxPhotosPerGallery,
        template.definition.limits.maxPhotosPerGallery,
      )
    case 'text':
    case 'rich-text':
    case 'recipient-name':
      throw new MediaAssetValidationError(
        `Letter Field does not accept media: ${field.id}`,
      )
  }
}

function getMaxBytes(
  template: CatalogTemplate,
  field: (typeof template.definition.fields)[number],
  kind: 'photo' | 'audio',
) {
  if (kind === 'photo') {
    return 'maxFileSizeMb' in field && field.maxFileSizeMb
      ? field.maxFileSizeMb * 1024 * 1024
      : DEFAULT_PHOTO_MAX_BYTES
  }

  return DEFAULT_AUDIO_MAX_BYTES
}

function getMaxDurationSeconds(
  template: CatalogTemplate,
  field: (typeof template.definition.fields)[number],
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

export function validateMediaUpload(
  template: CatalogTemplate,
  request: MediaUploadRequest,
  activeAssetCount: number,
): ValidatedMediaUpload {
  const field = getField(template, request.fieldId)
  const kind =
    field.type === 'audio'
      ? 'audio'
      : field.type === 'photo' || field.type === 'photo-gallery'
        ? 'photo'
        : undefined

  if (!kind) {
    throw new MediaAssetValidationError(
      `Letter Field does not accept media: ${request.fieldId}`,
    )
  }

  const maxCount = getMaxCount(template, field)

  if (activeAssetCount >= maxCount) {
    throw new MediaAssetValidationError(
      `${field.label} allows at most ${maxCount} media asset${maxCount === 1 ? '' : 's'}`,
    )
  }

  const allowedContentTypes =
    kind === 'photo' ? PHOTO_CONTENT_TYPES : AUDIO_CONTENT_TYPES

  if (!allowedContentTypes.has(request.contentType)) {
    throw new MediaAssetValidationError(
      `Unsupported ${kind} file type: ${request.contentType}`,
    )
  }

  if (!Number.isSafeInteger(request.byteSize) || request.byteSize <= 0) {
    throw new MediaAssetValidationError(
      'Media file size must be a positive integer',
    )
  }

  const maxBytes = getMaxBytes(template, field, kind)

  if (request.byteSize > maxBytes) {
    throw new MediaAssetValidationError(
      `${field.label} must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller`,
    )
  }

  const maxDurationSeconds = getMaxDurationSeconds(template, field)

  if (maxDurationSeconds !== undefined) {
    if (
      request.durationSeconds === undefined ||
      !Number.isFinite(request.durationSeconds) ||
      request.durationSeconds <= 0
    ) {
      throw new MediaAssetValidationError(
        `${field.label} requires a valid audio duration`,
      )
    }

    if (request.durationSeconds > maxDurationSeconds) {
      throw new MediaAssetValidationError(
        `${field.label} must be ${maxDurationSeconds} seconds or shorter`,
      )
    }
  }

  const normalizedFileName = request.fileName.replace(/[\\/\0]/g, '_').trim()

  if (!normalizedFileName || normalizedFileName.length > 255) {
    throw new MediaAssetValidationError(
      'Media file name must be between 1 and 255 characters',
    )
  }

  return {
    ...request,
    normalizedFileName,
    kind,
  }
}
