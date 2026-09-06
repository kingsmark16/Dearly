import { Module } from '@nestjs/common'
import { PublicLettersController } from './public/public-letters.controller.js'
import { PublicLettersService } from './public/public-letters.service.js'

@Module({
  controllers: [PublicLettersController],
  providers: [PublicLettersService],
})
export class LettersModule {}
