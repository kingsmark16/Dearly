import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator'

export class TestGoogleAuthorizeQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  redirect_uri!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  state!: string
}
