import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { PublicLettersService } from './public-letters.service.js'

@AllowAnonymous()
@Controller('public/letters')
export class PublicLettersController {
  constructor(
    @Inject(PublicLettersService)
    private readonly publicLettersService: PublicLettersService,
  ) {}

  @Get(':slug')
  async getPublishedLetter(@Param('slug') slug: string) {
    const letter = await this.publicLettersService.findBySlugOrShareToken(slug)

    if (!letter) {
      throw new NotFoundException('Published letter not found')
    }

    return letter
  }
}
