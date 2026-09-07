import { Module } from '@nestjs/common'
import { TestGoogleOAuthController } from './test-google-oauth.controller.js'

@Module({
  controllers: [TestGoogleOAuthController],
})
export class TestAuthModule {}
