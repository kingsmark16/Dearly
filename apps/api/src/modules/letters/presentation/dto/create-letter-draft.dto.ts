import { Transform } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator'

const templateSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value
}

export class CreateLetterDraftDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(templateSlugPattern, { message: 'templateSlug must be URL-safe' })
  templateSlug!: string

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string
}
