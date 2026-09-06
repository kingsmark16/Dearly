import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { CatalogTemplateNotFoundError } from '../../catalog/domain/template.js'
import { VerifiedCreatorGuard } from '../../creator/guards/verified-creator.guard.js'
import { CreateLetterDraftUseCase } from '../application/create-letter-draft.use-case.js'
import { ListCreatorLettersUseCase } from '../application/list-creator-letters.use-case.js'
import { CreateLetterDraftDto } from './dto/create-letter-draft.dto.js'
import {
  toCreatorLetterDraftResponse,
  toCreatorLetterSummaryResponse,
} from './dto/creator-letter-response.dto.js'

@Controller('letters')
@UseGuards(VerifiedCreatorGuard)
export class LettersController {
  constructor(
    @Inject(CreateLetterDraftUseCase)
    private readonly createLetterDraftUseCase: CreateLetterDraftUseCase,
    @Inject(ListCreatorLettersUseCase)
    private readonly listCreatorLettersUseCase: ListCreatorLettersUseCase,
  ) {}

  @Get()
  async listCreatorLetters(@Session() session: UserSession) {
    const letters = await this.listCreatorLettersUseCase.execute(
      session.user.id,
    )

    return letters.map(toCreatorLetterSummaryResponse)
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
}
