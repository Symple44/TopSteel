import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { ParameterScope, ParameterType } from '../entities/parameter-system.entity'

export class CreateParameterSystemDto {
  @IsString()
  group!: string

  @IsString()
  key!: string

  @IsString()
  value!: string

  @IsEnum(ParameterType)
  type!: ParameterType

  @IsEnum(ParameterScope)
  scope!: ParameterScope

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  metadata?: {
    icon?: string
    color?: string
    order?: number
    category?: string
    permissions?: string[]
    [key: string]: unknown
  }

  @IsArray()
  @IsOptional()
  arrayValues?: string[] // Pour stocker des tableaux de valeurs

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, unknown> // Pour stocker des objets complexes

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isReadonly?: boolean

  @IsString()
  @IsOptional()
  defaultLanguage?: string

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>
}

export class UpdateParameterSystemDto {
  @IsString()
  @IsOptional()
  value?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  arrayValues?: string[]

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, unknown>

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isReadonly?: boolean

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>
}

export class ParameterSystemQueryDto {
  @IsString()
  @IsOptional()
  group?: string

  @IsEnum(ParameterScope)
  @IsOptional()
  scope?: ParameterScope

  @IsEnum(ParameterType)
  @IsOptional()
  type?: ParameterType

  @IsString()
  @IsOptional()
  search?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

// DTO spécialisé pour les rôles utilisateurs avec tableaux
export class CreateUserRoleParameterDto {
  @IsString()
  roleKey!: string // Ex: 'SUPER_ADMIN'

  @IsString()
  roleName!: string // Ex: 'Super Administrateur'

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsString()
  @IsOptional()
  color?: string

  @IsArray()
  @IsOptional()
  permissions?: string[] // Tableau des permissions

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>
}

// DTO pour gérer des listes de valeurs (ex: statuts, types, etc.)
export class CreateEnumParameterDto {
  @IsString()
  group!: string // Ex: 'order_statuses'

  @IsArray()
  enumValues!: Array<{
    key: string
    value: string
    description?: string
    icon?: string
    color?: string
    order?: number
    metadata?: Record<string, unknown>
  }>

  @IsObject()
  @IsOptional()
  globalTranslations?: Record<string, Record<string, string>>
}
