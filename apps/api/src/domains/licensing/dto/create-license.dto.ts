import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { BillingCycle, LicenseType } from '@prisma/client'

export class CreateLicenseDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsNotEmpty()
  @IsString()
  societeId: string

  @ApiProperty({ description: 'Nom du client' })
  @IsNotEmpty()
  @IsString()
  customerName: string

  @ApiProperty({ description: 'Email du client' })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string

  @ApiPropertyOptional({
    description: 'Type de license',
    enum: LicenseType,
    default: LicenseType.BASIC,
  })
  @IsOptional()
  @IsEnum(LicenseType)
  type?: LicenseType

  @ApiPropertyOptional({
    description: 'Cycle de facturation',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional()
  startsAt?: Date

  @ApiPropertyOptional({ description: "Date d'expiration" })
  @IsOptional()
  expiresAt?: Date

  @ApiPropertyOptional({ description: "Nombre maximum d'utilisateurs" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number

  @ApiPropertyOptional({ description: 'Nombre maximum de sites' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSites?: number

  @ApiPropertyOptional({ description: 'Nombre maximum de transactions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTransactions?: number

  @ApiPropertyOptional({ description: 'Stockage maximum (GB)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStorage?: number

  @ApiPropertyOptional({ description: "Nombre maximum d'appels API" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxApiCalls?: number

  @ApiPropertyOptional({ description: 'Autoriser les modules personnalisés' })
  @IsOptional()
  allowCustomModules?: boolean

  @ApiPropertyOptional({ description: "Autoriser l'accès API" })
  @IsOptional()
  allowApiAccess?: boolean

  @ApiPropertyOptional({ description: 'Autoriser le white label' })
  @IsOptional()
  allowWhiteLabel?: boolean

  @ApiPropertyOptional({ description: 'Prix de la license' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @ApiPropertyOptional({ description: 'Devise', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: 'Renouvellement automatique' })
  @IsOptional()
  autoRenew?: boolean

  @ApiPropertyOptional({ description: 'Restrictions (JSON)' })
  @IsOptional()
  restrictions?: any

  @ApiPropertyOptional({ description: 'Métadonnées (JSON)' })
  @IsOptional()
  metadata?: any

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string
}
