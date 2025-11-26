import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'

// Local enum definitions
export enum ApplicationParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  DATE = 'DATE',
  FORMULA = 'FORMULA',
  TEMPLATE = 'TEMPLATE',
}

export enum ApplicationParameterScope {
  WORKFLOW = 'WORKFLOW',
  BUSINESS_RULE = 'BUSINESS_RULE',
  PRICING = 'PRICING',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
}

export class CreateParameterApplicationDto {
  @IsString()
  group!: string

  @IsString()
  key!: string

  @IsString()
  value!: string

  @IsEnum(ApplicationParameterType)
  type!: ApplicationParameterType

  @IsEnum(ApplicationParameterScope)
  scope!: ApplicationParameterScope

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  businessRules?: {
    validation?: Record<string, unknown>
    automation?: Record<string, unknown>
    dependencies?: string[]
    conditions?: Record<string, unknown>
    [key: string]: unknown
  }

  @IsObject()
  @IsOptional()
  metadata?: {
    icon?: string
    color?: string
    order?: number
    category?: string
    department?: string
    priority?: number
    [key: string]: unknown
  }

  @IsArray()
  @IsOptional()
  arrayValues?: string[] // Pour stocker des tableaux de valeurs métier

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, unknown> // Pour stocker des objets métier complexes

  @IsString()
  @IsOptional()
  formula?: string

  @IsString()
  @IsOptional()
  template?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean

  @IsString()
  @IsOptional()
  defaultLanguage?: string

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>

  @IsString()
  @IsOptional()
  createdBy?: string
}

export class UpdateParameterApplicationDto {
  @IsString()
  @IsOptional()
  value?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  businessRules?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  arrayValues?: string[]

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, unknown>

  @IsString()
  @IsOptional()
  formula?: string

  @IsString()
  @IsOptional()
  template?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>

  @IsString()
  @IsOptional()
  updatedBy?: string
}

export class ParameterApplicationQueryDto {
  @IsString()
  @IsOptional()
  group?: string

  @IsEnum(ApplicationParameterScope)
  @IsOptional()
  scope?: ApplicationParameterScope

  @IsEnum(ApplicationParameterType)
  @IsOptional()
  type?: ApplicationParameterType

  @IsString()
  @IsOptional()
  search?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsString()
  @IsOptional()
  createdBy?: string
}

// DTO spécialisé pour les configurations métier avec tableaux
export class CreateBusinessConfigDto {
  @IsString()
  configGroup!: string // Ex: 'workflow_steps'

  @IsString()
  configKey!: string // Ex: 'project_approval_flow'

  @IsArray()
  steps!: Array<{
    id: string
    name: string
    description?: string
    order: number
    requiredRole?: string
    autoApprove?: boolean
    conditions?: Record<string, unknown>
  }>

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>
}

// DTO pour gérer des listes de produits, catégories, etc.
export class CreateCategoryParameterDto {
  @IsString()
  categoryGroup!: string // Ex: 'product_categories'

  @IsArray()
  categories!: Array<{
    key: string
    name: string
    description?: string
    parentKey?: string // Pour hiérarchie
    icon?: string
    color?: string
    order?: number
    isActive?: boolean
    metadata?: Record<string, unknown>
  }>

  @IsObject()
  @IsOptional()
  globalTranslations?: Record<string, Record<string, string>>
}

