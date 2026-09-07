import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  Redirect,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { TestGoogleAuthorizeQueryDto } from './dto/test-google-authorize-query.dto.js'

@AllowAnonymous()
@Controller('test/google')
export class TestGoogleOAuthController {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  @Redirect()
  authorize(@Query() query: TestGoogleAuthorizeQueryDto) {
    if (
      this.configService.getOrThrow<string>('NODE_ENV') !== 'test' ||
      this.configService.getOrThrow<string>('GOOGLE_AUTH_MODE') !== 'fixture'
    ) {
      throw new NotFoundException()
    }

    const expectedCallbackUrl = new URL(
      '/api/auth/callback/google',
      this.configService.getOrThrow<string>('BETTER_AUTH_URL'),
    ).toString()

    if (query.redirect_uri !== expectedCallbackUrl) {
      throw new BadRequestException('Invalid Google fixture callback URL')
    }

    const callbackUrl = new URL(query.redirect_uri)
    callbackUrl.searchParams.set('code', 'dearly-google-fixture-code')
    callbackUrl.searchParams.set('state', query.state)

    return {
      statusCode: 302,
      url: callbackUrl.toString(),
    }
  }
}
