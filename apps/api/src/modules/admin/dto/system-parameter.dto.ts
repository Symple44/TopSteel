import { IsEnum, IsString, IsBoolean, IsOptional, IsObject } from 'class-validator'
import { ParameterType, ParameterCategory } from '../entitites/system-parameter.entity'

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
  metadata?: Record<string, any>
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
  metadata?: Record<string, any>
}

export class SystemParameterQueryDto {
  @IsEnum(ParameterCategory)
  @IsOptional()
  category?: ParameterCategory

  @IsString()
  @IsOptional()
  search?: string
}