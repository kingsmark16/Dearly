import { IsIn, IsString } from 'class-validator'

export class DeleteCreatorAccountDto {
  @IsString()
  @IsIn(['DELETE'])
  confirmation!: string
}
