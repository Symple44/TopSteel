import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsNumber, IsObject, IsDateString, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SiteType, SiteStatus, AccessibiliteType } from '../entities/partner-site.entity'

export class CreatePartnerSiteDto {
  @ApiProperty()
  @IsUUID()
  partnerId!: string

  @ApiProperty()
  @IsString()
  code!: string

  @ApiProperty()
  @IsString()
  nom!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: SiteType })
  @IsEnum(SiteType)
  type!: SiteType

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteLivraisons?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteEnlevements?: boolean

  // Localisation
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresseComplement?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number

  // Contact
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  // Capacités
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceM2?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  capaciteStockageTonnes?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hauteurMaxM?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsMaxTonnes?: number

  @ApiPropertyOptional({ enum: AccessibiliteType })
  @IsOptional()
  @IsEnum(AccessibiliteType)
  accessibilite?: AccessibiliteType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typeVehiculeMax?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasQuaiChargement?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasChariot?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasPontRoulant?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasGrue?: boolean

  // Horaires
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  horaires?: Record<string, any>

  // Instructions
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsLivraison?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consignesSecurite?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  documentsRequis?: Record<string, any>

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOuverture?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFermeture?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class UpdatePartnerSiteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ enum: SiteType })
  @IsOptional()
  @IsEnum(SiteType)
  type?: SiteType

  @ApiPropertyOptional({ enum: SiteStatus })
  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteLivraisons?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteEnlevements?: boolean

  // Localisation
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresseComplement?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number

  // Contact
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  // Capacités
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceM2?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  capaciteStockageTonnes?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hauteurMaxM?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsMaxTonnes?: number

  @ApiPropertyOptional({ enum: AccessibiliteType })
  @IsOptional()
  @IsEnum(AccessibiliteType)
  accessibilite?: AccessibiliteType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typeVehiculeMax?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasQuaiChargement?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasChariot?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasPontRoulant?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasGrue?: boolean

  // Horaires et autres
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  horaires?: Record<string, any>

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsLivraison?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consignesSecurite?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  documentsRequis?: Record<string, any>

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOuverture?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFermeture?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class PartnerSiteFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @ApiPropertyOptional({ enum: SiteType })
  @IsOptional()
  @IsEnum(SiteType)
  type?: SiteType

  @ApiPropertyOptional({ enum: SiteStatus })
  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteLivraisons?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string
}