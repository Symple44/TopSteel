import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator'
import {
  ClientParameterAccess,
  ClientParameterScope,
  ClientParameterType,
} from '../entities/parameter-client.entity'

export class CreateParameterClientDto {
  @IsUUID()
  tenantId!: string

  @IsString()
  group!: string

  @IsString()
  key!: string

  @IsString()
  value!: string

  @IsEnum(ClientParameterType)
  type!: ClientParameterType

  @IsEnum(ClientParameterScope)
  scope!: ClientParameterScope

  @IsEnum(ClientParameterAccess)
  access!: ClientParameterAccess

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  constraints?: {
    minValue?: number
    maxValue?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    allowedValues?: string[]
    fileTypes?: string[]
    maxFileSize?: number
    [key: string]: any
  }

  @IsObject()
  @IsOptional()
  metadata?: {
    icon?: string
    category?: string
    order?: number
    helpText?: string
    placeholder?: string
    section?: string
    [key: string]: any
  }

  @IsArray()
  @IsOptional()
  arrayValues?: string[] // Pour stocker des tableaux de préférences client

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, any> // Pour stocker des objets de configuration client

  @IsString()
  @IsOptional()
  defaultValue?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean

  @IsString()
  @IsOptional()
  defaultLanguage?: string

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>

  @IsUUID()
  @IsOptional()
  userId?: string

  @IsString()
  @IsOptional()
  createdBy?: string
}

export class UpdateParameterClientDto {
  @IsString()
  @IsOptional()
  value?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsObject()
  @IsOptional()
  constraints?: Record<string, any>

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsArray()
  @IsOptional()
  arrayValues?: string[]

  @IsObject()
  @IsOptional()
  objectValues?: Record<string, any>

  @IsString()
  @IsOptional()
  defaultValue?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>

  @IsString()
  @IsOptional()
  updatedBy?: string
}

export class ParameterClientQueryDto {
  @IsUUID()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  group?: string

  @IsEnum(ClientParameterScope)
  @IsOptional()
  scope?: ClientParameterScope

  @IsEnum(ClientParameterType)
  @IsOptional()
  type?: ClientParameterType

  @IsEnum(ClientParameterAccess)
  @IsOptional()
  access?: ClientParameterAccess

  @IsString()
  @IsOptional()
  search?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean

  @IsUUID()
  @IsOptional()
  userId?: string
}

// DTO spécialisé pour les préférences utilisateur avec tableaux
export class CreateUserPreferencesDto {
  @IsUUID()
  tenantId!: string

  @IsUUID()
  userId!: string

  @IsArray()
  @IsOptional()
  favoriteModules?: string[] // Modules préférés

  @IsArray()
  @IsOptional()
  quickActions?: Array<{
    id: string
    label: string
    action: string
    icon?: string
    order: number
  }> // Actions rapides personnalisées

  @IsArray()
  @IsOptional()
  dashboardWidgets?: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    config: Record<string, any>
  }> // Widgets du tableau de bord

  @IsObject()
  @IsOptional()
  uiSettings?: {
    theme?: string
    sidebarCollapsed?: boolean
    defaultView?: string
    itemsPerPage?: number
    [key: string]: any
  }

  @IsObject()
  @IsOptional()
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
    categories?: string[]
  }
}

// DTO pour la configuration du thème client avec tableaux
export class CreateClientThemeDto {
  @IsUUID()
  tenantId!: string

  @IsObject()
  colors!: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    [key: string]: string
  }

  @IsArray()
  @IsOptional()
  customFonts?: Array<{
    name: string
    url: string
    weight?: string
    style?: string
  }>

  @IsArray()
  @IsOptional()
  customIcons?: Array<{
    name: string
    svg: string
    category?: string
  }>

  @IsObject()
  @IsOptional()
  branding?: {
    logo?: string
    favicon?: string
    companyName?: string
    slogan?: string
  }

  @IsArray()
  @IsOptional()
  customCss?: string[] // Feuilles de style personnalisées
}
