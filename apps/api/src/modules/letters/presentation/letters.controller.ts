import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { CatalogTemplateNotFoundError } from '../../catalog/domain/template.js'
import { VerifiedCreatorGuard } from '../../creator/guards/verified-creator.guard.js'
import { CreateLetterDraftUseCase } from '../application/create-letter-draft.use-case.js'
import { GetCreatorLetterUseCase } from '../application/get-creator-letter.use-case.js'
import { ListCreatorLettersUseCase } from '../application/list-creator-letters.use-case.js'
import { PublishLetterUseCase } from '../application/publish-letter.use-case.js'
import { UpdateLetterUseCase } from '../application/update-letter.use-case.js'
import {
  LetterNotFoundError,
  LetterDraftNotFoundError,
  LetterDraftValidationError,
  LetterPublishValidationError,
} from '../domain/letter.js'
import { CreateLetterDraftDto } from './dto/create-letter-draft.dto.js'
import {
  toCreatorLetterDraftResponse,
  toCreatorLetterSummaryResponse,
} from './dto/creator-letter-response.dto.js'
import { UpdateLetterDraftDto } from './dto/update-letter-draft.dto.js'
import { createLetterShareUrl } from '../application/share-url.js'
import type { CreatorLetterRecord } from '../domain/letter.js'

@Controller('letters')
@UseGuards(VerifiedCreatorGuard)
export class LettersController {
  constructor(
    @Inject(CreateLetterDraftUseCase)
    private readonly createLetterDraftUseCase: CreateLetterDraftUseCase,
    @Inject(GetCreatorLetterUseCase)
    private readonly getCreatorLetterUseCase: GetCreatorLetterUseCase,
    @Inject(ListCreatorLettersUseCase)
    private readonly listCreatorLettersUseCase: ListCreatorLettersUseCase,
    @Inject(PublishLetterUseCase)
    private readonly publishLetterUseCase: PublishLetterUseCase,
    @Inject(UpdateLetterUseCase)
    private readonly updateLetterUseCase: UpdateLetterUseCase,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async listCreatorLetters(@Session() session: UserSession) {
    const letters = await this.listCreatorLettersUseCase.execute(
      session.user.id,
    )

    return letters.map((letter) =>
      toCreatorLetterSummaryResponse(letter, this.getShareUrl(letter)),
    )
  }

  @Get(':id')
  async getDraft(
    @Session() session: UserSession,
    @Param('id') letterId: string,
  ) {
    try {
      const letter = await this.getCreatorLetterUseCase.execute(
        session.user.id,
        letterId,
      )

      return toCreatorLetterDraftResponse(letter, this.getShareUrl(letter))
    } catch (error: unknown) {
      this.throwLetterError(error)
    }
  }

  @Post()
  async createDraft(
    @Session() session: UserSession,
    @Body() input: CreateLetterDraftDto,
  ) {
    try {
      const letter = await this.createLetterDraftUseCase.execute({
        creatorId: session.user.id,
        templateSlug: input.templateSlug,
        title: input.title,
      })

      return toCreatorLetterDraftResponse(letter, null)
    } catch (error: unknown) {
      if (error instanceof CatalogTemplateNotFoundError) {
        throw new NotFoundException('Catalog template not found')
      }

      throw error
    }
  }

  @Patch(':id')
  async updateDraft(
    @Session() session: UserSession,
    @Param('id') letterId: string,
    @Body() input: UpdateLetterDraftDto,
  ) {
    try {
      const letter = await this.updateLetterUseCase.execute({
        creatorId: session.user.id,
        letterId,
        title: input.title,
        content: input.content,
      })

      return toCreatorLetterDraftResponse(letter, this.getShareUrl(letter))
    } catch (error: unknown) {
      this.throwLetterError(error)
    }
  }

  @Post(':id/publish')
  async publishDraft(
    @Session() session: UserSession,
    @Param('id') letterId: string,
  ) {
    try {
      const result = await this.publishLetterUseCase.execute({
        creatorId: session.user.id,
        letterId,
      })

      return {
        id: result.letter.id,
        status: result.letter.status,
        shareUrl: result.shareUrl,
      }
    } catch (error: unknown) {
      if (error instanceof LetterPublishValidationError) {
        throw new BadRequestException({
          message: error.message,
          problems: error.problems,
        })
      }

      this.throwLetterError(error)
    }
  }

  private getShareUrl(letter: CreatorLetterRecord) {
    return letter.status === 'published'
      ? createLetterShareUrl(
          this.configService.getOrThrow<string>('WEB_ORIGIN'),
          letter.shareToken,
        )
      : null
  }

  private throwLetterError(error: unknown): never {
    if (error instanceof LetterDraftNotFoundError) {
      throw new NotFoundException('Letter Draft not found')
    }

    if (error instanceof LetterNotFoundError) {
      throw new NotFoundException('Letter not found')
    }

    if (error instanceof LetterDraftValidationError) {
      throw new BadRequestException(error.message)
    }

    throw error
  }
}
