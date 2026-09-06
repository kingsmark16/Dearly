import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer, { type Transporter } from 'nodemailer'

export type VerificationEmail = {
  recipient: string
  verificationUrl: string
}

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name)
  private readonly verificationEmails: VerificationEmail[] = []
  private readonly isTestEnvironment: boolean
  private readonly transporter: Transporter | null

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.isTestEnvironment =
      this.configService.getOrThrow<string>('NODE_ENV') === 'test'

    if (this.isTestEnvironment) {
      this.transporter = null
      return
    }

    const user = this.configService.getOrThrow<string>('SMTP_USER')
    const password = this.configService.getOrThrow<string>('SMTP_PASSWORD')

    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      secure: this.configService.getOrThrow<boolean>('SMTP_SECURE'),
      ...(user && password ? { auth: { user, pass: password } } : {}),
    })
  }

  async sendVerificationEmail(input: VerificationEmail) {
    if (this.isTestEnvironment) {
      this.verificationEmails.unshift({
        recipient: input.recipient.toLowerCase(),
        verificationUrl: input.verificationUrl,
      })
      return
    }

    await this.sendEmail(input)
  }

  getLatestVerificationUrl(recipient: string) {
    return this.verificationEmails.find(
      (email) => email.recipient === recipient.toLowerCase(),
    )?.verificationUrl
  }

  private async sendEmail(input: VerificationEmail) {
    if (!this.transporter) {
      throw new Error('Email transporter is not initialized')
    }

    await this.transporter.sendMail({
      from: {
        address: this.configService.getOrThrow<string>('SMTP_FROM'),
        name: 'Dearly',
      },
      to: input.recipient,
      subject: 'Verify your Dearly Creator account',
      text: `Welcome to Dearly. Verify your email address here: ${input.verificationUrl}`,
      html: `<p>Welcome to Dearly.</p><p><a href="${input.verificationUrl}">Verify your email address</a></p>`,
    })

    this.logger.debug(`Verification email sent to ${input.recipient}`)
  }
}
