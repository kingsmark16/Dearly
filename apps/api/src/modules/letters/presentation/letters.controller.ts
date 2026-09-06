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
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { CatalogTemplateNotFoundError } from '../../catalog/domain/template.js'
import { VerifiedCreatorGuard } from '../../creator/guards/verified-creator.guard.js'
import { CreateLetterDraftUseCase } from '../application/create-letter-draft.use-case.js'
import { GetCreatorLetterDraftUseCase } from '../application/get-creator-letter-draft.use-case.js'
import { ListCreatorLettersUseCase } from '../application/list-creator-letters.use-case.js'
import { PublishLetterUseCase } from '../application/publish-letter.use-case.js'
import { UpdateLetterDraftUseCase } from '../application/update-letter-draft.use-case.js'
import {
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

@Controller('letters')
@UseGuards(VerifiedCreatorGuard)
export class LettersController {
  constructor(
    @Inject(CreateLetterDraftUseCase)
    private readonly createLetterDraftUseCase: CreateLetterDraftUseCase,
    @Inject(GetCreatorLetterDraftUseCase)
    private readonly getCreatorLetterDraftUseCase: GetCreatorLetterDraftUseCase,
    @Inject(ListCreatorLettersUseCase)
    private readonly listCreatorLettersUseCase: ListCreatorLettersUseCase,
    @Inject(PublishLetterUseCase)
    private readonly publishLetterUseCase: PublishLetterUseCase,
    @Inject(UpdateLetterDraftUseCase)
    private readonly updateLetterDraftUseCase: UpdateLetterDraftUseCase,
  ) {}

  @Get()
  async listCreatorLetters(@Session() session: UserSession) {
    const letters = await this.listCreatorLettersUseCase.execute(
      session.user.id,
    )

    return letters.map(toCreatorLetterSummaryResponse)
  }

  @Get(':id')
  async getDraft(
    @Session() session: UserSession,
    @Param('id') letterId: string,
  ) {
    try {
      const letter = await this.getCreatorLetterDraftUseCase.execute(
        session.user.id,
        letterId,
      )

      return toCreatorLetterDraftResponse(letter)
    } catch (error: unknown) {
      this.throwDraftError(error)
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

      return toCreatorLetterDraftResponse(letter)
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
      const letter = await this.updateLetterDraftUseCase.execute({
        creatorId: session.user.id,
        letterId,
        title: input.title,
        content: input.content,
      })

      return toCreatorLetterDraftResponse(letter)
    } catch (error: unknown) {
      this.throwDraftError(error)
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

      this.throwDraftError(error)
    }
  }

  private throwDraftError(error: unknown): never {
    if (error instanceof LetterDraftNotFoundError) {
      throw new NotFoundException('Letter Draft not found')
    }

    if (error instanceof LetterDraftValidationError) {
      throw new BadRequestException(error.message)
    }

    throw error
  }
}
