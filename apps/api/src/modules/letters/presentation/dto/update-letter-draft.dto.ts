import { Transform } from 'class-transformer'
import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator'

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value
}

export class UpdateLetterDraftDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string

  @IsObject()
  content!: Record<string, unknown>
}
