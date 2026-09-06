import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  AcceptUploadInput,
  CreateUploadIntentInput,
  DownloadIntent,
  ObjectStorage,
  StoredObject,
  UploadIntent,
} from '../application/ports/object-storage.js'

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    name?: string
    $metadata?: { httpStatusCode?: number }
  }

  return (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchKey' ||
    candidate.$metadata?.httpStatusCode === 404
  )
}

@Injectable()
export class R2ObjectStorage implements ObjectStorage {
  private readonly client: S3Client
  private readonly bucketName: string

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const accountId = configService.getOrThrow<string>('R2_ACCOUNT_ID')
    const accessKeyId = configService.getOrThrow<string>('R2_ACCESS_KEY_ID')
    const secretAccessKey = configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    )

    this.bucketName = configService.getOrThrow<string>('R2_BUCKET_NAME')
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async createUploadIntent(
    input: CreateUploadIntentInput,
  ): Promise<UploadIntent> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000)
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: input.key,
      ContentType: input.contentType,
    })
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
    })

    return { uploadUrl, expiresAt }
  }

  async headObject(key: string): Promise<StoredObject | undefined> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      )

      if (result.ContentLength === undefined || !result.ContentType) {
        return undefined
      }

      return {
        key,
        contentType: result.ContentType,
        byteSize: result.ContentLength,
      }
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return undefined
      }

      throw error
    }
  }

  async createDownloadIntent(input: {
    key: string
    expiresInSeconds: number
  }): Promise<DownloadIntent> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000)
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: input.key,
    })
    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
    })

    return { downloadUrl, expiresAt }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
    )
  }

  async acceptUpload(input: AcceptUploadInput): Promise<void> {
    void input
    throw new Error('R2 uploads must use the presigned upload URL')
  }
}
