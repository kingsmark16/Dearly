import { Module } from '@nestjs/common'
import { HealthController } from './health.controller.js'
import { PublicLettersController } from './public-letters.controller.js'
import { PublicLettersService } from './public-letters.service.js'

@Module({
  controllers: [HealthController, PublicLettersController],
  providers: [PublicLettersService],
})
export class AppModule {}
