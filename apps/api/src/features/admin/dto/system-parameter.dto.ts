import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { ParameterCategory, ParameterType } from '../entitites/system-parameter.entity'
import { SystemParameter } from '@prisma/client'


export class CreateSystemParameterDto {
  @IsString()
  key!: string

  @IsString()
  value!: string

  @IsEnum(ParameterType)
  type!: ParameterType

  @IsEnum(ParameterCategory)
  category!: ParameterCategory

  @IsString()
  description!: string

  @IsString()
  @IsOptional()
  defaultValue?: string

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

export class UpdateSystemParameterDto {
  @IsString()
  @IsOptional()
  value?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  defaultValue?: string

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

export class SystemParameterQueryDto {
  @IsEnum(ParameterCategory)
  @IsOptional()
  category?: ParameterCategory

  @IsString()
  @IsOptional()
  search?: string
}

