import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Req,
  Res,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { Inject } from '@nestjs/common'
import {
  LOCAL_OBJECT_STORAGE,
  type LocalObjectStorage,
} from '../application/ports/object-storage.js'

const MAX_LOCAL_UPLOAD_BYTES = 100 * 1024 * 1024

async function readRequestBody(request: Request) {
  const chunks: Buffer[] = []
  let byteSize = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteSize += buffer.byteLength

    if (byteSize > MAX_LOCAL_UPLOAD_BYTES) {
      throw new Error('Uploaded media is too large')
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

@AllowAnonymous()
@Controller('media')
export class LocalMediaStorageController {
  constructor(
    @Inject(LOCAL_OBJECT_STORAGE)
    private readonly localObjectStorage: LocalObjectStorage | null,
  ) {}

  @Put('uploads/:token')
  async upload(@Param('token') token: string, @Req() request: Request) {
    if (!this.localObjectStorage) {
      throw new NotFoundException()
    }

    const contentType = request.headers['content-type']

    if (typeof contentType !== 'string' || !contentType) {
      throw new NotFoundException()
    }

    try {
      await this.localObjectStorage.acceptUpload({
        token,
        contentType,
        body: await readRequestBody(request),
      })
    } catch {
      throw new NotFoundException('Upload intent is missing or expired')
    }

    return { uploaded: true }
  }

  @Get('downloads/:token')
  async download(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!this.localObjectStorage) {
      throw new NotFoundException()
    }

    const object = this.localObjectStorage.readDownload(token)

    if (!object) {
      throw new NotFoundException('Download intent is missing or expired')
    }

    response.type(object.contentType)
    return Buffer.from(object.body)
  }
}
