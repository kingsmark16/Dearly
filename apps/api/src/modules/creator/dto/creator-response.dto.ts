import { Expose, Type } from 'class-transformer'

export class CreatorResponseDto {
  @Expose()
  id!: string

  @Expose()
  name!: string

  @Expose()
  email!: string

  @Expose()
  emailVerified!: boolean

  constructor(partial: Partial<CreatorResponseDto>) {
    Object.assign(this, partial)
  }
}

export class CreatorProfileResponseDto {
  @Expose()
  @Type(() => CreatorResponseDto)
  creator!: CreatorResponseDto

  constructor(partial: Partial<CreatorProfileResponseDto>) {
    Object.assign(this, partial)
  }
}
