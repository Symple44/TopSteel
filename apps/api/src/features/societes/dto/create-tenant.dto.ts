import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { SocietePlan } from '../entities/societe.entity'

export class CreateTenantDto {
  @ApiProperty({ description: 'Nom de la société', example: 'Métallurgie ACME' })
  @IsString()
  @IsNotEmpty()
  nom!: string

  @ApiProperty({ description: 'Code unique de la société', example: 'ACME' })
  @IsString()
  @IsNotEmpty()
  code!: string

  @ApiPropertyOptional({ description: 'Numéro SIRET', example: '12345678901234' })
  @IsOptional()
  @IsString()
  siret?: string

  @ApiPropertyOptional({ description: 'Numéro TVA', example: 'FR12345678901' })
  @IsOptional()
  @IsString()
  tva?: string

  @ApiPropertyOptional({ description: 'Adresse complète' })
  @IsOptional()
  @IsString()
  adresse?: string

  @ApiPropertyOptional({ description: 'Code postal', example: '75001' })
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional({ description: 'Ville', example: 'Paris' })
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional({ description: 'Pays', example: 'France' })
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional({ description: 'Téléphone', example: '+33123456789' })
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional({ description: 'Email', example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ description: 'Site web', example: 'https://www.acme.com' })
  @IsOptional()
  @IsString()
  website?: string

  @ApiPropertyOptional({
    description: 'Plan de la société',
    enum: SocietePlan,
    example: SocietePlan.PROFESSIONAL,
  })
  @IsOptional()
  @IsEnum(SocietePlan)
  plan?: SocietePlan

  @ApiPropertyOptional({
    description: "Nombre maximum d'utilisateurs",
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxUsers?: number

  @ApiPropertyOptional({
    description: 'Nombre maximum de sites',
    example: 3,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxSites?: number

  @ApiPropertyOptional({
    description: 'Stockage maximum en bytes',
    example: 10737418240, // 10GB
  })
  @IsOptional()
  @IsNumber()
  maxStorageBytes?: number

  @ApiPropertyOptional({ description: 'Configuration personnalisée' })
  @IsOptional()
  configuration?: {
    modules?: string[]
    features?: string[]
    theme?: Record<string, unknown>
    locale?: string
    timezone?: string
  }
}
