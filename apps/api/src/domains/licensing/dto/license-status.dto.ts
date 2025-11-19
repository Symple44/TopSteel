import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { BillingCycle } from '@prisma/client'

export class SuspendLicenseDto {
  @ApiPropertyOptional({ description: 'Raison de la suspension' })
  @IsOptional()
  @IsString()
  reason?: string
}

export class RevokeLicenseDto {
  @ApiPropertyOptional({ description: 'Raison de la révocation' })
  @IsOptional()
  @IsString()
  reason?: string
}

export class RenewLicenseDto {
  @ApiPropertyOptional({ description: 'Nouvelle date d\'expiration' })
  @IsOptional()
  expiresAt?: Date

  @ApiPropertyOptional({ description: 'Nouveau prix' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @ApiPropertyOptional({ description: 'Cycle de facturation' })
  @IsOptional()
  billingCycle?: BillingCycle
}

export class ActivateLicenseDto {
  @ApiPropertyOptional({ description: 'ID de l\'utilisateur qui active' })
  @IsOptional()
  @IsString()
  activatedBy?: string
}

export class ValidateLicenseDto {
  @ApiProperty({ description: 'Clé de license à valider' })
  @IsNotEmpty()
  @IsString()
  licenseKey: string
}
