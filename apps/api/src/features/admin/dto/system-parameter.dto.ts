import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { SystemParameter } from '@prisma/client'

/**
 * Parameter types for system configuration
 */
export enum ParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

/**
 * Parameter categories for system configuration
 */
export enum ParameterCategory {
  SYSTEM = 'SYSTEM',
  APPLICATION = 'APPLICATION',
  SECURITY = 'SECURITY',
  INTEGRATION = 'INTEGRATION',
  FEATURE = 'FEATURE',
}


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

