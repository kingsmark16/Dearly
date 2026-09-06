import { Inject, Injectable } from '@nestjs/common'
import {
  LetterStatus,
  MediaAssetKind,
  MediaAssetStatus,
  Prisma,
} from '../../../../generated/prisma/client.js'
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js'
import type {
  CreatePendingMediaAsset,
  MediaAssetRecord,
} from '../domain/media-asset.js'
import { contentReferencesMediaAsset } from '../domain/media-content.js'
import type { MediaAssetRepository } from '../application/ports/media-asset-repository.js'

function toMediaAssetRecord(asset: {
  id: string
  letterId: string
  fieldId: string
  kind: MediaAssetKind
  status: MediaAssetStatus
  objectKey: string
  originalFileName: string
  contentType: string
  byteSize: number
  durationSeconds: number | null
  uploadExpiresAt: Date
  createdAt: Date
  updatedAt: Date
}): MediaAssetRecord {
  const shared = {
    id: asset.id,
    letterId: asset.letterId,
    fieldId: asset.fieldId,
    kind:
      asset.kind === MediaAssetKind.PHOTO
        ? ('photo' as const)
        : ('audio' as const),
    objectKey: asset.objectKey,
    originalFileName: asset.originalFileName,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    ...(asset.durationSeconds === null
      ? {}
      : { durationSeconds: asset.durationSeconds }),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }

  if (asset.status === MediaAssetStatus.PENDING) {
    return {
      ...shared,
      status: 'pending',
      expiresAt: asset.uploadExpiresAt,
    }
  }

  return { ...shared, status: 'ready' }
}

function toMediaAssetKind(kind: 'photo' | 'audio') {
  return kind === 'photo' ? MediaAssetKind.PHOTO : MediaAssetKind.AUDIO
}

@Injectable()
export class PrismaMediaAssetRepository implements MediaAssetRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async countActiveByField(
    letterId: string,
    fieldId: string,
    now: Date,
  ): Promise<number> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
      },
      select: { content: true },
    })

    if (!letter) {
      return 0
    }

    const fieldValue =
      typeof letter.content === 'object' &&
      letter.content !== null &&
      !Array.isArray(letter.content)
        ? (letter.content as Record<string, unknown>)[fieldId]
        : undefined
    const referencedAssetIds =
      typeof fieldValue === 'string'
        ? [fieldValue]
        : Array.isArray(fieldValue)
          ? fieldValue.filter(
              (assetId): assetId is string => typeof assetId === 'string',
            )
          : []

    return this.prisma.mediaAsset.count({
      where: {
        letterId,
        fieldId,
        OR: [
          {
            id: { in: referencedAssetIds },
            status: MediaAssetStatus.READY,
          },
          { status: MediaAssetStatus.PENDING, uploadExpiresAt: { gt: now } },
        ],
      },
    })
  }

  async createPending(
    input: CreatePendingMediaAsset,
  ): Promise<MediaAssetRecord> {
    const asset = await this.prisma.mediaAsset.create({
      data: {
        id: input.id,
        letterId: input.letterId,
        fieldId: input.fieldId,
        kind: toMediaAssetKind(input.kind),
        status: MediaAssetStatus.PENDING,
        objectKey: input.objectKey,
        originalFileName: input.originalFileName,
        contentType: input.contentType,
        byteSize: input.byteSize,
        durationSeconds: input.durationSeconds,
        uploadExpiresAt: input.expiresAt,
      },
    })

    return toMediaAssetRecord(asset)
  }

  async deletePending(letterId: string, assetId: string): Promise<void> {
    await this.prisma.mediaAsset.deleteMany({
      where: {
        id: assetId,
        letterId,
        status: MediaAssetStatus.PENDING,
      },
    })
  }

  async findForCreator(
    creatorId: string,
    letterId: string,
    assetId: string,
  ): Promise<MediaAssetRecord | undefined> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        letterId,
        letter: { creatorId },
      },
    })

    return asset ? toMediaAssetRecord(asset) : undefined
  }

  async listForCreator(
    creatorId: string,
    letterId: string,
  ): Promise<MediaAssetRecord[]> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        letterId,
        letter: { creatorId },
      },
      orderBy: { createdAt: 'asc' },
    })

    return assets.map(toMediaAssetRecord)
  }

  async completeAndAttach(input: {
    creatorId: string
    letterId: string
    assetId: string
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
        },
      })

      if (!letter) {
        return undefined
      }

      const updated = await transaction.mediaAsset.updateMany({
        where: {
          id: input.assetId,
          letterId: input.letterId,
          status: MediaAssetStatus.PENDING,
        },
        data: { status: MediaAssetStatus.READY },
      })

      if (updated.count === 0) {
        return undefined
      }

      await transaction.letter.update({
        where: { id: input.letterId },
        data: { content: input.content as Prisma.InputJsonObject },
      })

      const asset = await transaction.mediaAsset.findUnique({
        where: { id: input.assetId },
      })

      return asset ? toMediaAssetRecord(asset) : undefined
    })
  }

  async deleteAndDetach(input: {
    creatorId: string
    letterId: string
    assetId: string
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
        },
      })
      const asset = await transaction.mediaAsset.findFirst({
        where: { id: input.assetId, letterId: input.letterId },
      })

      if (!letter || !asset) {
        return undefined
      }

      const remainsInPublishedContent =
        letter.status === LetterStatus.PUBLISHED &&
        contentReferencesMediaAsset(
          letter.content as Record<string, unknown>,
          asset.id,
        )

      if (!remainsInPublishedContent) {
        await transaction.mediaAsset.delete({ where: { id: asset.id } })
      }
      await transaction.letter.update({
        where: { id: input.letterId },
        data: { content: input.content as Prisma.InputJsonObject },
      })

      return toMediaAssetRecord(asset)
    })
  }

  async reorderAndSave(input: {
    creatorId: string
    letterId: string
    fieldId: string
    assetIds: string[]
    content: Record<string, unknown>
  }): Promise<MediaAssetRecord[] | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
        },
      })

      if (!letter) {
        return undefined
      }

      const assets = await transaction.mediaAsset.findMany({
        where: {
          id: { in: input.assetIds },
          letterId: input.letterId,
          fieldId: input.fieldId,
          status: MediaAssetStatus.READY,
        },
      })

      if (assets.length !== input.assetIds.length) {
        return undefined
      }

      await transaction.letter.update({
        where: { id: input.letterId },
        data: { content: input.content as Prisma.InputJsonObject },
      })

      const assetById = new Map(
        assets.map((asset) => [asset.id, toMediaAssetRecord(asset)]),
      )

      return input.assetIds.map((assetId) => assetById.get(assetId)!)
    })
  }
}
