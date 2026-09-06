import { z } from 'zod'

const isoDateTimeSchema = z.string().datetime()

export const MediaAssetKindSchema = z.enum(['photo', 'audio'])
export const MediaAssetStatusSchema = z.enum(['pending', 'ready'])

export const CreatorMediaAssetSchema = z.object({
  id: z.string().min(1),
  fieldId: z.string().min(1),
  kind: MediaAssetKindSchema,
  status: MediaAssetStatusSchema,
  originalFileName: z.string().min(1),
  contentType: z.string().min(1),
  byteSize: z.number().int().positive(),
  durationSeconds: z.number().positive().optional(),
  previewUrl: z.string().url().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const MediaUploadIntentSchema = z.object({
  asset: CreatorMediaAssetSchema,
  uploadUrl: z.string().url(),
  expiresAt: isoDateTimeSchema,
})

export const CreatorMediaAssetListSchema = z.array(CreatorMediaAssetSchema)

export const CreateMediaUploadIntentInputSchema = z.object({
  fieldId: z.string().min(1).max(120),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(128),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024),
  durationSeconds: z
    .number()
    .positive()
    .max(60 * 60)
    .optional(),
})

export const ReorderMediaGalleryInputSchema = z.object({
  assetIds: z.array(z.string().min(1)).max(100),
})

export type CreatorMediaAsset = z.infer<typeof CreatorMediaAssetSchema>
export type MediaUploadIntent = z.infer<typeof MediaUploadIntentSchema>
export type CreateMediaUploadIntentInput = z.infer<
  typeof CreateMediaUploadIntentInputSchema
>
export type ReorderMediaGalleryInput = z.infer<
  typeof ReorderMediaGalleryInputSchema
>
