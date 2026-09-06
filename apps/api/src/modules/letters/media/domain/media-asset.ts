export type MediaAssetKind = 'photo' | 'audio'
export type MediaAssetStatus = 'pending' | 'ready'

export type CreatePendingMediaAsset = {
  id: string
  letterId: string
  fieldId: string
  kind: MediaAssetKind
  objectKey: string
  originalFileName: string
  contentType: string
  byteSize: number
  durationSeconds?: number
  expiresAt: Date
}

export type PendingMediaAsset = CreatePendingMediaAsset & {
  status: 'pending'
  createdAt: Date
  updatedAt: Date
}

export type ReadyMediaAsset = Omit<
  PendingMediaAsset,
  'status' | 'expiresAt'
> & {
  status: 'ready'
  durationSeconds?: number
}

export type MediaAssetRecord = PendingMediaAsset | ReadyMediaAsset

export class MediaAssetNotFoundError extends Error {
  constructor(assetId: string) {
    super(`Media asset not found: ${assetId}`)
    this.name = 'MediaAssetNotFoundError'
  }
}

export class MediaAssetValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaAssetValidationError'
  }
}
