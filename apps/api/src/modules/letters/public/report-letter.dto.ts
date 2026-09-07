import { LETTER_REPORT_REASONS } from '@dearly/contracts/letters/letter-report'
import { Transform } from 'class-transformer'
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value
}

function trimOptionalString({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export class ReportLetterDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @IsIn([...LETTER_REPORT_REASONS])
  reason!: (typeof LETTER_REPORT_REASONS)[number]

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string
}
