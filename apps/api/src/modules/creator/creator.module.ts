import { Module } from '@nestjs/common'
import { DeleteCreatorAccountUseCase } from './application/delete-creator-account.use-case.js'
import { CREATOR_ACCOUNT_REPOSITORY } from './application/ports/creator-account-repository.js'
import { CreatorController } from './creator.controller.js'
import { VerifiedCreatorGuard } from './guards/verified-creator.guard.js'
import { PrismaCreatorAccountRepository } from './infrastructure/prisma-creator-account.repository.js'

@Module({
  controllers: [CreatorController],
  providers: [
    VerifiedCreatorGuard,
    DeleteCreatorAccountUseCase,
    PrismaCreatorAccountRepository,
    {
      provide: CREATOR_ACCOUNT_REPOSITORY,
      useExisting: PrismaCreatorAccountRepository,
    },
  ],
  exports: [CREATOR_ACCOUNT_REPOSITORY, VerifiedCreatorGuard],
})
export class CreatorModule {}
