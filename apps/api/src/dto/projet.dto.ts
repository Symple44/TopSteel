// apps/api/src/dto/projet.dto.ts
import { IsString, IsUUID, IsOptional, IsEnum, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ProjetType, ProjetPriorite } from '@erp/types'

export class CreateProjetDto {
  @IsUUID()
  clientId: string

  @IsString()
  description: string

  @IsEnum(ProjetType)
  type: ProjetType

  @IsEnum(ProjetPriorite)
  priorite: ProjetPriorite

  @IsOptional()
  @IsString()
  dateDebut?: string

  @IsOptional()
  @IsString()
  dateFin?: string

  @ValidateNested()
  @Type(() => AdresseDto)
  adresseChantier: AdresseDto

  @IsOptional()
  @IsString()
  notes?: string
}