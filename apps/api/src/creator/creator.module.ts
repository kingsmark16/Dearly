import { Module } from '@nestjs/common'
import { CreatorController } from './creator.controller.js'
import { VerifiedCreatorGuard } from './verified-creator.guard.js'

@Module({
  controllers: [CreatorController],
  providers: [VerifiedCreatorGuard],
})
export class CreatorModule {}
