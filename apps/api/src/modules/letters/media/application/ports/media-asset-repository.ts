import type {
  CreatePendingMediaAsset,
  MediaAssetRecord,
} from '../../domain/media-asset.js'

export const MEDIA_ASSET_REPOSITORY = Symbol('MEDIA_ASSET_REPOSITORY')

export interface MediaAssetIntentRepository {
  countActiveByField(
    letterId: string,
    fieldId: string,
    now: Date,
  ): Promise<number>
  createPending(input: CreatePendingMediaAsset): Promise<MediaAssetRecord>
  deletePending(letterId: string, assetId: string): Promise<void>
}

export interface MediaAssetRepository extends MediaAssetIntentRepository {
  findForCreator(
    creatorId: string,
    letterId: string,
    assetId: string,
  ): Promise<MediaAssetRecord | undefined>
  listForCreator(
    creatorId: string,
    letterId: string,
  ): Promise<MediaAssetRecord[]>
  completeAndAttach(input: {
    creatorId: string
    letterId: string
    assetId: string
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord | undefined>
  deleteAndDetach(input: {
    creatorId: string
    letterId: string
    assetId: string
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord | undefined>
  reorderAndSave(input: {
    creatorId: string
    letterId: string
    fieldId: string
    assetIds: string[]
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord[] | undefined>
}
