import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { VerifiedCreatorGuard } from '../../../creator/guards/verified-creator.guard.js'
import { LetterDraftNotFoundError } from '../../domain/letter.js'
import {
  MediaAssetNotFoundError,
  MediaAssetValidationError,
} from '../domain/media-asset.js'
import { CompleteMediaUploadUseCase } from '../application/complete-media-upload.use-case.js'
import { CreateMediaUploadIntentUseCase } from '../application/create-media-upload-intent.use-case.js'
import { DeleteMediaAssetUseCase } from '../application/delete-media-asset.use-case.js'
import { GetCreatorLetterMediaUseCase } from '../application/get-creator-letter-media.use-case.js'
import { ReorderMediaGalleryUseCase } from '../application/reorder-media-gallery.use-case.js'
import {
  toCreatorMediaAssetResponse,
  toMediaUploadIntentResponse,
} from './dto/media-response.dto.js'
import { CreateMediaUploadIntentDto } from './dto/create-media-upload-intent.dto.js'
import { ReorderMediaGalleryDto } from './dto/reorder-media-gallery.dto.js'

@Controller('letters/:letterId/media')
@UseGuards(VerifiedCreatorGuard)
export class LetterMediaController {
  constructor(
    @Inject(CreateMediaUploadIntentUseCase)
    private readonly createMediaUploadIntentUseCase: CreateMediaUploadIntentUseCase,
    @Inject(CompleteMediaUploadUseCase)
    private readonly completeMediaUploadUseCase: CompleteMediaUploadUseCase,
    @Inject(DeleteMediaAssetUseCase)
    private readonly deleteMediaAssetUseCase: DeleteMediaAssetUseCase,
    @Inject(GetCreatorLetterMediaUseCase)
    private readonly getCreatorLetterMediaUseCase: GetCreatorLetterMediaUseCase,
    @Inject(ReorderMediaGalleryUseCase)
    private readonly reorderMediaGalleryUseCase: ReorderMediaGalleryUseCase,
  ) {}

  @Get()
  async listMedia(
    @Session() session: UserSession,
    @Param('letterId') letterId: string,
  ) {
    try {
      const assets = await this.getCreatorLetterMediaUseCase.execute(
        session.user.id,
        letterId,
      )

      return assets.map(toCreatorMediaAssetResponse)
    } catch (error: unknown) {
      this.throwMediaError(error)
    }
  }

  @Post('upload-intents')
  async createUploadIntent(
    @Session() session: UserSession,
    @Param('letterId') letterId: string,
    @Body() input: CreateMediaUploadIntentDto,
  ) {
    try {
      const result = await this.createMediaUploadIntentUseCase.execute({
        creatorId: session.user.id,
        letterId,
        fieldId: input.fieldId,
        fileName: input.fileName,
        contentType: input.contentType,
        byteSize: input.byteSize,
        durationSeconds: input.durationSeconds,
      })

      return toMediaUploadIntentResponse(result)
    } catch (error: unknown) {
      this.throwMediaError(error)
    }
  }

  @Post(':assetId/complete')
  async completeUpload(
    @Session() session: UserSession,
    @Param('letterId') letterId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      const asset = await this.completeMediaUploadUseCase.execute({
        creatorId: session.user.id,
        letterId,
        assetId,
      })

      return toCreatorMediaAssetResponse(asset)
    } catch (error: unknown) {
      this.throwMediaError(error)
    }
  }

  @Delete(':assetId')
  async deleteMedia(
    @Session() session: UserSession,
    @Param('letterId') letterId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      const asset = await this.deleteMediaAssetUseCase.execute({
        creatorId: session.user.id,
        letterId,
        assetId,
      })

      return toCreatorMediaAssetResponse(asset)
    } catch (error: unknown) {
      this.throwMediaError(error)
    }
  }

  @Patch(':fieldId/order')
  async reorderGallery(
    @Session() session: UserSession,
    @Param('letterId') letterId: string,
    @Param('fieldId') fieldId: string,
    @Body() input: ReorderMediaGalleryDto,
  ) {
    try {
      const assets = await this.reorderMediaGalleryUseCase.execute({
        creatorId: session.user.id,
        letterId,
        fieldId,
        assetIds: input.assetIds,
      })

      return assets.map(toCreatorMediaAssetResponse)
    } catch (error: unknown) {
      this.throwMediaError(error)
    }
  }

  private throwMediaError(error: unknown): never {
    if (
      error instanceof LetterDraftNotFoundError ||
      error instanceof MediaAssetNotFoundError
    ) {
      throw new NotFoundException(error.message)
    }

    if (error instanceof MediaAssetValidationError) {
      throw new BadRequestException(error.message)
    }

    throw error
  }
}
