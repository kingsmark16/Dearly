import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  SerializeOptions,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IsEmail } from 'class-validator'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { EmailDeliveryService } from './email-delivery.service.js'
import { VerificationEmailResponseDto } from './verification-email-response.dto.js'

class VerificationEmailQuery {
  @IsEmail()
  email!: string
}

@AllowAnonymous()
@Controller('test/mail')
export class TestMailController {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(EmailDeliveryService)
    private readonly emailDeliveryService: EmailDeliveryService,
  ) {}

  @Get('verification')
  @SerializeOptions({ excludeExtraneousValues: true })
  getVerificationEmail(@Query() query: VerificationEmailQuery) {
    if (this.configService.getOrThrow<string>('NODE_ENV') !== 'test') {
      throw new NotFoundException()
    }

    const verificationUrl = this.emailDeliveryService.getLatestVerificationUrl(
      query.email,
    )

    if (!verificationUrl) {
      throw new NotFoundException('Verification email not available yet')
    }

    return new VerificationEmailResponseDto({ verificationUrl })
  }
}
