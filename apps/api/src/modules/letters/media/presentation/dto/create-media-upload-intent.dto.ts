import { Transform, Type } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value
}

export class CreateMediaUploadIntentDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fieldId!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  contentType!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024)
  byteSize!: number

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(60 * 60)
  durationSeconds?: number
}
