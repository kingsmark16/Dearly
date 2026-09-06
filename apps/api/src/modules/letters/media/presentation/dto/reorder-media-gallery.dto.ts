import { IsArray, IsString, MaxLength } from 'class-validator'

export class ReorderMediaGalleryDto {
  @IsArray()
  @MaxLength(100, { each: true })
  @IsString({ each: true })
  assetIds!: string[]
}
