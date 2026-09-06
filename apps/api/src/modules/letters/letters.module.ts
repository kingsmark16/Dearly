import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module.js'
import { CreateLetterDraftUseCase } from './application/create-letter-draft.use-case.js'
import { GetCreatorLetterDraftUseCase } from './application/get-creator-letter-draft.use-case.js'
import { ListCreatorLettersUseCase } from './application/list-creator-letters.use-case.js'
import { LETTER_REPOSITORY } from './application/ports/letter-repository.js'
import { UpdateLetterDraftUseCase } from './application/update-letter-draft.use-case.js'
import { PrismaLetterRepository } from './infrastructure/prisma-letter.repository.js'
import { LettersController } from './presentation/letters.controller.js'
import { PublicLettersController } from './public/public-letters.controller.js'
import { PublicLettersService } from './public/public-letters.service.js'

@Module({
  imports: [CatalogModule],
  controllers: [LettersController, PublicLettersController],
  providers: [
    PublicLettersService,
    {
      provide: LETTER_REPOSITORY,
      useClass: PrismaLetterRepository,
    },
    CreateLetterDraftUseCase,
    GetCreatorLetterDraftUseCase,
    ListCreatorLettersUseCase,
    UpdateLetterDraftUseCase,
  ],
})
export class LettersModule {}
