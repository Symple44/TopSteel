import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { LicenseStatus, LicenseType } from '../entities/societe-license.entity'

export class CreateLicenseDto {
  @ApiProperty({ enum: LicenseType, default: LicenseType.BASIC })
  @IsEnum(LicenseType)
  type: LicenseType

  @ApiProperty({ description: "Nombre maximum d'utilisateurs", minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  maxUsers: number

  @ApiPropertyOptional({ description: 'Nombre maximum de sites' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxSites?: number

  @ApiPropertyOptional({ description: 'Stockage maximum en GB' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxStorageGB?: number

  @ApiPropertyOptional({ description: 'Autoriser les sessions concurrentes', default: true })
  @IsBoolean()
  @IsOptional()
  allowConcurrentSessions?: boolean

  @ApiPropertyOptional({ description: 'Nombre maximum de sessions concurrentes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxConcurrentSessions?: number

  @ApiPropertyOptional({ description: 'Fonctionnalités activées' })
  @IsObject()
  @IsOptional()
  features?: {
    marketplace?: boolean
    advancedReporting?: boolean
    apiAccess?: boolean
    customIntegrations?: boolean
    multiCurrency?: boolean
    advancedWorkflows?: boolean
    [key: string]: boolean | undefined
  }

  @ApiPropertyOptional({ description: 'Restrictions quantitatives' })
  @IsObject()
  @IsOptional()
  restrictions?: {
    maxTransactionsPerMonth?: number
    maxProductsPerCatalog?: number
    maxProjectsPerMonth?: number
    maxInvoicesPerMonth?: number
    [key: string]: number | undefined
  }

  @ApiPropertyOptional({ description: 'Date de début de validité' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validFrom?: Date

  @ApiPropertyOptional({ description: "Date d'expiration" })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date

  @ApiPropertyOptional({ description: 'Clé de licence' })
  @IsString()
  @IsOptional()
  licenseKey?: string

  @ApiPropertyOptional({ description: 'Informations de facturation' })
  @IsObject()
  @IsOptional()
  billing?: {
    plan?: string
    amount?: number
    currency?: string
    frequency?: 'monthly' | 'yearly' | 'one-time'
    lastPayment?: Date
    nextPayment?: Date
  }

  @ApiPropertyOptional({ description: 'Notes internes' })
  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateLicenseDto {
  @ApiPropertyOptional({ enum: LicenseType })
  @IsEnum(LicenseType)
  @IsOptional()
  type?: LicenseType

  @ApiPropertyOptional({ enum: LicenseStatus })
  @IsEnum(LicenseStatus)
  @IsOptional()
  status?: LicenseStatus

  @ApiPropertyOptional({ description: "Nombre maximum d'utilisateurs", minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  maxUsers?: number

  @ApiPropertyOptional({ description: 'Nombre maximum de sites' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxSites?: number

  @ApiPropertyOptional({ description: 'Stockage maximum en GB' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxStorageGB?: number

  @ApiPropertyOptional({ description: 'Autoriser les sessions concurrentes' })
  @IsBoolean()
  @IsOptional()
  allowConcurrentSessions?: boolean

  @ApiPropertyOptional({ description: 'Nombre maximum de sessions concurrentes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxConcurrentSessions?: number

  @ApiPropertyOptional({ description: 'Fonctionnalités activées' })
  @IsObject()
  @IsOptional()
  features?: {
    marketplace?: boolean
    advancedReporting?: boolean
    apiAccess?: boolean
    customIntegrations?: boolean
    multiCurrency?: boolean
    advancedWorkflows?: boolean
    [key: string]: boolean | undefined
  }

  @ApiPropertyOptional({ description: 'Restrictions quantitatives' })
  @IsObject()
  @IsOptional()
  restrictions?: {
    maxTransactionsPerMonth?: number
    maxProductsPerCatalog?: number
    maxProjectsPerMonth?: number
    maxInvoicesPerMonth?: number
    [key: string]: number | undefined
  }

  @ApiPropertyOptional({ description: 'Date de début de validité' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validFrom?: Date

  @ApiPropertyOptional({ description: "Date d'expiration" })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date

  @ApiPropertyOptional({ description: 'Clé de licence' })
  @IsString()
  @IsOptional()
  licenseKey?: string

  @ApiPropertyOptional({ description: 'Informations de facturation' })
  @IsObject()
  @IsOptional()
  billing?: {
    plan?: string
    amount?: number
    currency?: string
    frequency?: 'monthly' | 'yearly' | 'one-time'
    lastPayment?: Date
    nextPayment?: Date
  }

  @ApiPropertyOptional({ description: 'Notes internes' })
  @IsString()
  @IsOptional()
  notes?: string
}

export class SuspendLicenseDto {
  @ApiProperty({ description: 'Raison de la suspension' })
  @IsString()
  reason: string
}

export class CheckFeatureDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  societeId: string

  @ApiProperty({ description: 'Nom de la fonctionnalité à vérifier' })
  @IsString()
  feature: string
}

export class CheckRestrictionDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  societeId: string

  @ApiProperty({ description: 'Nom de la restriction à vérifier' })
  @IsString()
  restriction: string

  @ApiProperty({ description: 'Valeur actuelle à comparer avec la limite' })
  @IsInt()
  @Min(0)
  currentValue: number
}

export class LicenseResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  societeId: string

  @ApiProperty({ enum: LicenseType })
  type: LicenseType

  @ApiProperty({ enum: LicenseStatus })
  status: LicenseStatus

  @ApiProperty()
  maxUsers: number

  @ApiProperty()
  currentUsers: number

  @ApiPropertyOptional()
  maxSites?: number

  @ApiProperty()
  currentSites: number

  @ApiPropertyOptional()
  maxStorageGB?: number

  @ApiProperty()
  currentStorageGB: number

  @ApiProperty()
  allowConcurrentSessions: boolean

  @ApiPropertyOptional()
  maxConcurrentSessions?: number

  @ApiPropertyOptional()
  features?: Record<string, boolean>

  @ApiPropertyOptional()
  restrictions?: Record<string, number>

  @ApiPropertyOptional()
  validFrom?: Date

  @ApiPropertyOptional()
  expiresAt?: Date

  @ApiPropertyOptional()
  daysUntilExpiration?: number

  @ApiProperty()
  utilizationPercent: number

  @ApiProperty()
  isValid: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}

export class LicenseUsageStatsDto {
  @ApiProperty()
  societeId: string

  @ApiProperty()
  currentUsers: number

  @ApiProperty()
  maxUsers: number

  @ApiProperty()
  currentSites: number

  @ApiPropertyOptional()
  maxSites?: number

  @ApiProperty()
  currentStorageGB: number

  @ApiPropertyOptional()
  maxStorageGB?: number

  @ApiProperty()
  activeSessions: number

  @ApiPropertyOptional()
  maxConcurrentSessions?: number

  @ApiProperty()
  utilizationPercent: number

  @ApiPropertyOptional()
  daysUntilExpiration?: number

  @ApiPropertyOptional()
  features?: Record<string, boolean>

  @ApiPropertyOptional()
  restrictions?: Record<string, number>
}
import { SocieteLicense } from '@prisma/client'
