import { Expose } from 'class-transformer'

export class VerificationEmailResponseDto {
  @Expose()
  verificationUrl!: string

  constructor(partial: Partial<VerificationEmailResponseDto>) {
    Object.assign(this, partial)
  }
}
