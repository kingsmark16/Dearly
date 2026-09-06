import { Module } from '@nestjs/common'
import { EmailModule } from './email.module.js'
import { TestMailController } from './test-mail.controller.js'

@Module({
  imports: [EmailModule],
  controllers: [TestMailController],
})
export class TestMailModule {}
