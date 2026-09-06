import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import type { MediaUploadIntentResult } from '../../application/create-media-upload-intent.use-case.js'
import type { CreatorMediaAssetView } from '../../application/get-creator-letter-media.use-case.js'
import type { MediaAssetRecord } from '../../domain/media-asset.js'

function toCreatorMediaAsset(
  asset: MediaAssetRecord,
  previewUrl: string | null,
): CreatorMediaAsset {
  return {
    id: asset.id,
    fieldId: asset.fieldId,
    kind: asset.kind,
    status: asset.status,
    originalFileName: asset.originalFileName,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    ...(asset.durationSeconds === undefined
      ? {}
      : { durationSeconds: asset.durationSeconds }),
    previewUrl,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }
}

export function toCreatorMediaAssetResponse(
  asset: MediaAssetRecord | CreatorMediaAssetView,
): CreatorMediaAsset {
  return toCreatorMediaAsset(
    asset,
    'previewUrl' in asset ? asset.previewUrl : null,
  )
}

export function toMediaUploadIntentResponse(result: MediaUploadIntentResult) {
  return {
    asset: toCreatorMediaAssetResponse(result.asset),
    uploadUrl: result.uploadUrl,
    expiresAt: result.expiresAt.toISOString(),
  }
}
