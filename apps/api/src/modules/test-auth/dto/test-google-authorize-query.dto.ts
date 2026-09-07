import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator'

export class TestGoogleAuthorizeQueryDto {
  @IsOptional()
  @IsIn(['code'])
  response_type?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  client_id?: string

  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  redirect_uri!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  state!: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  scope?: string

  @IsOptional()
  @IsIn(['S256'])
  code_challenge_method?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  code_challenge?: string
}
