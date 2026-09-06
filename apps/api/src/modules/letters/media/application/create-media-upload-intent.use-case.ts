import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CREATOR_LETTER_READER,
  type LetterOwnerReader,
} from '../../application/ports/letter-repository.js'
import { LetterDraftNotFoundError } from '../../domain/letter.js'
import {
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetIntentRepository,
} from './ports/media-asset-repository.js'
import {
  OBJECT_STORAGE,
  type UploadIntentStorage,
} from './ports/object-storage.js'
import type { MediaAssetRecord } from '../domain/media-asset.js'
import {
  validateMediaUpload,
  type MediaUploadRequest,
} from '../domain/media-validation.js'

const DEFAULT_UPLOAD_INTENT_EXPIRY_SECONDS = 15 * 60

export type CreateMediaUploadIntentCommand = MediaUploadRequest & {
  creatorId: string
  letterId: string
}

export type MediaUploadIntentResult = {
  asset: MediaAssetRecord
  uploadUrl: string
  expiresAt: Date
}

@Injectable()
export class CreateMediaUploadIntentUseCase {
  constructor(
    @Inject(CREATOR_LETTER_READER)
    private readonly letterRepository: LetterOwnerReader,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: MediaAssetIntentRepository,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: UploadIntentStorage,
    @Optional()
    @Inject(ConfigService)
    private readonly configService?: ConfigService,
  ) {}

  async execute(
    command: CreateMediaUploadIntentCommand,
  ): Promise<MediaUploadIntentResult> {
    const letter = await this.letterRepository.findByIdForCreator(
      command.creatorId,
      command.letterId,
    )

    if (!letter) {
      throw new LetterDraftNotFoundError(command.letterId)
    }

    const activeAssetCount = await this.mediaAssetRepository.countActiveByField(
      command.letterId,
      command.fieldId,
      new Date(),
    )
    const validatedUpload = validateMediaUpload(
      letter.template,
      command,
      activeAssetCount,
    )
    const assetId = randomUUID()
    const objectKey = `letters/${command.letterId}/media/${assetId}`
    const expiresInSeconds =
      this.configService?.get<number>('MEDIA_UPLOAD_INTENT_TTL_SECONDS') ??
      DEFAULT_UPLOAD_INTENT_EXPIRY_SECONDS
    const intent = await this.objectStorage.createUploadIntent({
      key: objectKey,
      contentType: validatedUpload.contentType,
      expiresInSeconds,
    })

    const asset = await this.mediaAssetRepository.createPending({
      id: assetId,
      letterId: command.letterId,
      fieldId: validatedUpload.fieldId,
      kind: validatedUpload.kind,
      objectKey,
      originalFileName: validatedUpload.normalizedFileName,
      contentType: validatedUpload.contentType,
      byteSize: validatedUpload.byteSize,
      ...(validatedUpload.durationSeconds === undefined
        ? {}
        : { durationSeconds: validatedUpload.durationSeconds }),
      expiresAt: intent.expiresAt,
    })

    return {
      asset,
      uploadUrl: intent.uploadUrl,
      expiresAt: intent.expiresAt,
    }
  }
}
