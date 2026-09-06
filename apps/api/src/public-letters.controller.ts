import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { PublicLettersService } from './public-letters.service.js'

@Controller('public/letters')
export class PublicLettersController {
  constructor(
    @Inject(PublicLettersService)
    private readonly publicLettersService: PublicLettersService,
  ) {}

  @Get(':slug')
  getPublishedLetter(@Param('slug') slug: string) {
    const letter = this.publicLettersService.findBySlug(slug)

    if (!letter) {
      throw new NotFoundException('Published letter not found')
    }

    return letter
  }
}
