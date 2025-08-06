import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { PageStatus, PageType } from '../entities/page-template.entity'

export class CreatePageSectionDto {
  @IsString()
  type!: string

  @IsString()
  name!: string

  @IsObject()
  @IsOptional()
  content?: unknown

  @IsObject()
  @IsOptional()
  styles?: unknown

  @IsObject()
  @IsOptional()
  responsive?: unknown

  @IsObject()
  @IsOptional()
  settings?: unknown
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
  metadata?: unknown

  @IsObject()
  @IsOptional()
  settings?: unknown

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePageSectionDto)
  @IsOptional()
  sections?: CreatePageSectionDto[]
}
