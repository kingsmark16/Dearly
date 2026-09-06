import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type {
  AcceptUploadInput,
  CreateUploadIntentInput,
  DownloadedObject,
  DownloadIntent,
  LocalObjectStorage,
  StoredObject,
  UploadIntent,
} from '../application/ports/object-storage.js'

type PendingUpload = {
  key: string
  contentType: string
  expiresAt: Date
}

type DownloadToken = {
  key: string
  expiresAt: Date
}

type StoredObjectValue = StoredObject & { body: Uint8Array }

@Injectable()
export class InMemoryObjectStorage implements LocalObjectStorage {
  private readonly pendingUploads = new Map<string, PendingUpload>()
  private readonly downloadTokens = new Map<string, DownloadToken>()
  private readonly objects = new Map<string, StoredObjectValue>()
  private readonly uploadOrigin: string
  private readonly uploadIntentTtlSeconds: number

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.uploadOrigin = configService.getOrThrow<string>('BETTER_AUTH_URL')
    this.uploadIntentTtlSeconds = configService.getOrThrow<number>(
      'MEDIA_UPLOAD_INTENT_TTL_SECONDS',
    )
  }

  async createUploadIntent(
    input: CreateUploadIntentInput,
  ): Promise<UploadIntent> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000)

    this.pendingUploads.set(token, {
      key: input.key,
      contentType: input.contentType,
      expiresAt,
    })

    return {
      uploadUrl: `${this.uploadOrigin}/api/v1/media/uploads/${token}`,
      expiresAt,
    }
  }

  async headObject(key: string): Promise<StoredObject | undefined> {
    const object = this.objects.get(key)

    if (!object) {
      return undefined
    }

    return {
      key: object.key,
      contentType: object.contentType,
      byteSize: object.byteSize,
    }
  }

  async createDownloadIntent(input: {
    key: string
    expiresInSeconds: number
  }): Promise<DownloadIntent> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000)

    this.downloadTokens.set(token, { key: input.key, expiresAt })

    return {
      downloadUrl: `${this.uploadOrigin}/api/v1/media/downloads/${token}`,
      expiresAt,
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key)
  }

  async acceptUpload(input: AcceptUploadInput): Promise<void> {
    const pending = this.pendingUploads.get(input.token)

    if (!pending || pending.expiresAt.getTime() <= Date.now()) {
      this.pendingUploads.delete(input.token)
      throw new Error('Upload intent is missing or expired')
    }

    if (pending.contentType !== input.contentType) {
      throw new Error('Uploaded content type does not match the upload intent')
    }

    this.objects.set(pending.key, {
      key: pending.key,
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      body: input.body,
    })
    this.pendingUploads.delete(input.token)
  }

  readDownload(token: string): DownloadedObject | undefined {
    const download = this.downloadTokens.get(token)

    if (!download || download.expiresAt.getTime() <= Date.now()) {
      this.downloadTokens.delete(token)
      return undefined
    }

    const object = this.objects.get(download.key)

    return object
      ? { contentType: object.contentType, body: object.body }
      : undefined
  }

  getConfiguredUploadIntentTtlSeconds() {
    return this.uploadIntentTtlSeconds
  }
}
