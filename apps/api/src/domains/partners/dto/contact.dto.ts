import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { ContactPreference, ContactRole, ContactStatus } from '../entities/contact.entity'

export class ContactDisponibiliteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  horaires?: {
    lundi?: { debut: string; fin: string }
    mardi?: { debut: string; fin: string }
    mercredi?: { debut: string; fin: string }
    jeudi?: { debut: string; fin: string }
    vendredi?: { debut: string; fin: string }
  }

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  joursAbsence?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noteDisponibilite?: string
}

export class CreateContactDto {
  @ApiProperty()
  @IsUUID()
  partnerId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerSiteId?: string

  @ApiProperty()
  @IsString()
  prenom!: string

  @ApiProperty()
  @IsString()
  nom!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  civilite?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fonction?: string

  @ApiProperty({ enum: ContactRole })
  @IsEnum(ContactRole)
  role!: ContactRole

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneDirect?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneStandard?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax?: string

  @ApiProperty({ enum: ContactPreference })
  @IsEnum(ContactPreference)
  preferenceContact!: ContactPreference

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteEmails?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteSms?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDisponibiliteDto)
  disponibilites?: ContactDisponibiliteDto

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  langue?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateNaissance?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class UpdateContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerSiteId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prenom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  civilite?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fonction?: string

  @ApiPropertyOptional({ enum: ContactRole })
  @IsOptional()
  @IsEnum(ContactRole)
  role?: ContactRole

  @ApiPropertyOptional({ enum: ContactStatus })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneDirect?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneStandard?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax?: string

  @ApiPropertyOptional({ enum: ContactPreference })
  @IsOptional()
  @IsEnum(ContactPreference)
  preferenceContact?: ContactPreference

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteEmails?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepteSms?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDisponibiliteDto)
  disponibilites?: ContactDisponibiliteDto

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  langue?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateNaissance?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class ContactFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerSiteId?: string

  @ApiPropertyOptional({ enum: ContactRole })
  @IsOptional()
  @IsEnum(ContactRole)
  role?: ContactRole

  @ApiPropertyOptional({ enum: ContactStatus })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string
}
