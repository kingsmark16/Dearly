export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE')
export const LOCAL_OBJECT_STORAGE = Symbol('LOCAL_OBJECT_STORAGE')

export type CreateUploadIntentInput = {
  key: string
  contentType: string
  expiresInSeconds: number
}

export type UploadIntent = {
  uploadUrl: string
  expiresAt: Date
}

export type DownloadIntent = {
  downloadUrl: string
  expiresAt: Date
}

export type StoredObject = {
  key: string
  contentType: string
  byteSize: number
}

export type AcceptUploadInput = {
  token: string
  contentType: string
  body: Uint8Array
}

export type DownloadedObject = {
  contentType: string
  body: Uint8Array
}

export interface UploadIntentStorage {
  createUploadIntent(input: CreateUploadIntentInput): Promise<UploadIntent>
}

export interface ObjectStorage extends UploadIntentStorage {
  headObject(key: string): Promise<StoredObject | undefined>
  createDownloadIntent(input: {
    key: string
    expiresInSeconds: number
  }): Promise<DownloadIntent>
  deleteObject(key: string): Promise<void>
  acceptUpload(input: AcceptUploadInput): Promise<void>
}

export interface LocalObjectStorage extends ObjectStorage {
  readDownload(token: string): DownloadedObject | undefined
}
