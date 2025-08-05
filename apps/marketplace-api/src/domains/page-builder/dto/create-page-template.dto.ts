import { IsString, IsOptional, IsEnum, IsArray, IsObject, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PageType, PageStatus } from '../entities/page-template.entity'

export class CreatePageSectionDto {
  @IsString()
  type!: string

  @IsString()
  name!: string

  @IsObject()
  @IsOptional()
  content?: any

  @IsObject()
  @IsOptional()
  styles?: any

  @IsObject()
  @IsOptional()
  responsive?: any

  @IsObject()
  @IsOptional()
  settings?: any
}

export class CreatePageTemplateDto {
  @IsString()
  name!: string

  @IsString()
  slug!: string

  @IsEnum(PageType)
  @IsOptional()
  pageType?: PageType

  @IsEnum(PageStatus)
  @IsOptional()
  status?: PageStatus

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  metadata?: any

  @IsObject()
  @IsOptional()
  settings?: any

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePageSectionDto)
  @IsOptional()
  sections?: CreatePageSectionDto[]
}
