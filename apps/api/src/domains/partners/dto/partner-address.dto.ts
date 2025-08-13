import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { AddressStatus, AddressType } from '../entities/partner-address.entity'

export class CreatePartnerAddressDto {
  @ApiProperty()
  @IsUUID()
  partnerId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerSiteId?: string

  @ApiProperty()
  @IsString()
  libelle!: string

  @ApiProperty({ enum: AddressType })
  @IsEnum(AddressType)
  type!: AddressType

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiProperty()
  @IsString()
  ligne1!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne2?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne3?: string

  @ApiProperty()
  @IsString()
  codePostal!: string

  @ApiProperty()
  @IsString()
  ville!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codePays?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactTelephone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsAcces?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string
}

export class UpdatePartnerAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerSiteId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  libelle?: string

  @ApiPropertyOptional({ enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType

  @ApiPropertyOptional({ enum: AddressStatus })
  @IsOptional()
  @IsEnum(AddressStatus)
  status?: AddressStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne1?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne2?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne3?: string

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
  region?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codePays?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactTelephone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsAcces?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string
}
