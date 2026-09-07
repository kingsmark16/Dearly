import { IsIn, IsString } from 'class-validator'

export class PermanentlyDeleteLetterDto {
  @IsString()
  @IsIn(['DELETE'])
  confirmation!: string
}
