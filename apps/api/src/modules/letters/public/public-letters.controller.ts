import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ReportLetterDto } from './report-letter.dto.js'
import { ReportLetterUseCase } from './report-letter.use-case.js'
import { PublicLettersService } from './public-letters.service.js'

@AllowAnonymous()
@Controller('public/letters')
export class PublicLettersController {
  constructor(
    @Inject(PublicLettersService)
    private readonly publicLettersService: PublicLettersService,
    @Inject(ReportLetterUseCase)
    private readonly reportLetterUseCase: ReportLetterUseCase,
  ) {}

  @Get(':slug')
  async getPublishedLetter(@Param('slug') slug: string) {
    const letter = await this.publicLettersService.findBySlugOrShareToken(slug)

    if (!letter) {
      throw new NotFoundException('Published letter not found')
    }

    return letter
  }

  @Post(':slug/report')
  async reportPublishedLetter(
    @Param('slug') shareToken: string,
    @Body() input: ReportLetterDto,
  ) {
    const result = await this.reportLetterUseCase.execute({
      shareToken,
      reason: input.reason,
      details: input.details,
    })

    if (!result) {
      throw new NotFoundException('Published letter not found')
    }

    return result
  }
}
