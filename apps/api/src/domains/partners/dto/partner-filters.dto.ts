import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { PartnerCategory, PartnerStatus, PartnerType } from '../entities/partner.entity'

/**
 * DTO pour les filtres de recherche de partenaires
 */
export class PartnerFiltersDto {
  @ApiPropertyOptional({
    description: 'Types de partenaires à filtrer',
    enum: PartnerType,
    isArray: true,
    example: [PartnerType.CLIENT, PartnerType.FOURNISSEUR],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PartnerType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  type?: PartnerType[]

  @ApiPropertyOptional({
    description: 'Statuts à filtrer',
    enum: PartnerStatus,
    isArray: true,
    example: [PartnerStatus.ACTIF],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PartnerStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: PartnerStatus[]

  @ApiPropertyOptional({
    description: 'Catégories à filtrer',
    enum: PartnerCategory,
    isArray: true,
    example: [PartnerCategory.ENTREPRISE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PartnerCategory, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  categorie?: PartnerCategory[]

  @ApiPropertyOptional({
    description: 'Recherche textuelle dans la dénomination',
    example: 'ACME',
  })
  @IsOptional()
  @IsString()
  denomination?: string

  @ApiPropertyOptional({
    description: 'Recherche par code (partielle)',
    example: 'CLI-',
  })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({
    description: 'Recherche par ville',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional({
    description: 'Recherche par région',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional({
    description: 'Recherche par pays',
    example: 'France',
  })
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional({
    description: "Recherche par secteur d'activité",
    example: 'Métallurgie',
  })
  @IsOptional()
  @IsString()
  secteurActivite?: string

  @ApiPropertyOptional({
    description: 'Recherche par code postal (début)',
    example: '75',
  })
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional({
    description: 'Filtrer les partenaires préférés',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  prefere?: boolean

  @ApiPropertyOptional({
    description: 'Inclure les partenaires inactifs',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  inclureInactifs?: boolean

  @ApiPropertyOptional({
    description: 'Effectif minimum',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  effectifMin?: number

  @ApiPropertyOptional({
    description: 'Effectif maximum',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  effectifMax?: number

  @ApiPropertyOptional({
    description: "Chiffre d'affaires minimum",
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  chiffreAffairesMin?: number

  @ApiPropertyOptional({
    description: "Chiffre d'affaires maximum",
    example: 10000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  chiffreAffairesMax?: number

  @ApiPropertyOptional({
    description: 'Recherche textuelle globale',
    example: 'ACME Dupont',
  })
  @IsOptional()
  @IsString()
  searchText?: string

  @ApiPropertyOptional({
    description: 'Champ de tri',
    enum: ['code', 'denomination', 'type', 'status', 'ville', 'createdAt'],
    example: 'denomination',
  })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'

  @ApiPropertyOptional({
    description: 'Numéro de page (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number
}
