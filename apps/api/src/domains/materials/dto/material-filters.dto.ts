import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import {
  MaterialShape,
  MaterialStatus,
  MaterialType,
  StorageMethod,
} from '../entities/material.entity'

/**
 * DTO pour les filtres de recherche de matériaux
 */
export class MaterialFiltersDto {
  @ApiPropertyOptional({
    description: 'Types de matériaux à filtrer',
    enum: MaterialType,
    isArray: true,
    example: [MaterialType.ACIER, MaterialType.INOX],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MaterialType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  type?: MaterialType[]

  @ApiPropertyOptional({
    description: 'Formes de matériaux à filtrer',
    enum: MaterialShape,
    isArray: true,
    example: [MaterialShape.PLAQUE, MaterialShape.TUBE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MaterialShape, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  forme?: MaterialShape[]

  @ApiPropertyOptional({
    description: 'Statuts à filtrer',
    enum: MaterialStatus,
    isArray: true,
    example: [MaterialStatus.ACTIF],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MaterialStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: MaterialStatus[]

  @ApiPropertyOptional({
    description: 'Nuances à filtrer',
    isArray: true,
    example: ['S235JR', 'S355J2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  nuance?: string[]

  @ApiPropertyOptional({
    description: 'Recherche textuelle dans le nom',
    example: 'acier',
  })
  @IsOptional()
  @IsString()
  nom?: string

  @ApiPropertyOptional({
    description: 'Recherche par référence (partielle)',
    example: 'AC-PL',
  })
  @IsOptional()
  @IsString()
  reference?: string

  @ApiPropertyOptional({
    description: 'Recherche par marque',
    example: 'ArcelorMittal',
  })
  @IsOptional()
  @IsString()
  marque?: string

  @ApiPropertyOptional({
    description: 'ID du fournisseur principal',
    example: 'uuid-fournisseur',
  })
  @IsOptional()
  @IsString()
  fournisseurId?: string

  @ApiPropertyOptional({
    description: 'Condition de stock',
    enum: ['rupture', 'sous_mini', 'normal', 'surstock'],
    example: 'sous_mini',
  })
  @IsOptional()
  @IsString()
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'

  @ApiPropertyOptional({
    description: 'Filtrer les matériaux dangereux',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  dangereux?: boolean

  @ApiPropertyOptional({
    description: 'Inclure les matériaux obsolètes',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  obsolete?: boolean

  @ApiPropertyOptional({
    description: 'Stock physique minimum',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMin?: number

  @ApiPropertyOptional({
    description: 'Stock physique maximum',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMax?: number

  @ApiPropertyOptional({
    description: 'Prix minimum',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  prixMin?: number

  @ApiPropertyOptional({
    description: 'Prix maximum',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  prixMax?: number

  @ApiPropertyOptional({
    description: 'Poids minimum (kg)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  poidsMin?: number

  @ApiPropertyOptional({
    description: 'Poids maximum (kg)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  poidsMax?: number

  @ApiPropertyOptional({
    description: 'Longueur minimum (mm)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  longueurMin?: number

  @ApiPropertyOptional({
    description: 'Longueur maximum (mm)',
    example: 6000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  longueurMax?: number

  @ApiPropertyOptional({
    description: 'Largeur minimum (mm)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  largeurMin?: number

  @ApiPropertyOptional({
    description: 'Largeur maximum (mm)',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  largeurMax?: number

  @ApiPropertyOptional({
    description: 'Épaisseur minimum (mm)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  epaisseurMin?: number

  @ApiPropertyOptional({
    description: 'Épaisseur maximum (mm)',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  epaisseurMax?: number

  @ApiPropertyOptional({
    description: 'Diamètre minimum (mm)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  diametreMin?: number

  @ApiPropertyOptional({
    description: 'Diamètre maximum (mm)',
    example: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  diametreMax?: number

  @ApiPropertyOptional({
    description: 'Méthodes de stockage',
    enum: StorageMethod,
    isArray: true,
    example: [StorageMethod.STANDARD, StorageMethod.VERTICAL],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StorageMethod, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  methodeStockage?: StorageMethod[]

  @ApiPropertyOptional({
    description: 'Filtrer par emplacement de stockage',
    example: 'A-01',
  })
  @IsOptional()
  @IsString()
  emplacement?: string

  @ApiPropertyOptional({
    description: 'Certifications requises',
    isArray: true,
    example: ['CE', 'ISO 9001'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  certifications?: string[]

  @ApiPropertyOptional({
    description: 'Normes requises',
    isArray: true,
    example: ['EN 10025-2', 'NF A35-501'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  normes?: string[]

  @ApiPropertyOptional({
    description: 'Limite élastique minimum (MPa)',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  limiteElastiqueMin?: number

  @ApiPropertyOptional({
    description: 'Limite élastique maximum (MPa)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  limiteElastiqueMax?: number

  @ApiPropertyOptional({
    description: 'Résistance à la traction minimum (MPa)',
    example: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  resistanceTractionMin?: number

  @ApiPropertyOptional({
    description: 'Résistance à la traction maximum (MPa)',
    example: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  resistanceTractionMax?: number

  @ApiPropertyOptional({
    description: 'Recherche textuelle globale',
    example: 'acier plaque',
  })
  @IsOptional()
  @IsString()
  searchText?: string

  @ApiPropertyOptional({
    description: 'Champ de tri',
    enum: [
      'reference',
      'nom',
      'type',
      'forme',
      'stockPhysique',
      'prixUnitaire',
      'dateCreationFiche',
    ],
    example: 'reference',
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

/**
 * DTO pour les filtres avancés d'inventaire
 */
export class InventoryFiltersDto {
  @ApiPropertyOptional({
    description: 'Date de dernier mouvement minimum',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateDernierMouvementMin?: Date

  @ApiPropertyOptional({
    description: 'Date de dernier mouvement maximum',
    type: 'string',
    format: 'date-time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateDernierMouvementMax?: Date

  @ApiPropertyOptional({
    description: 'Date de dernier inventaire minimum',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateDernierInventaireMin?: Date

  @ApiPropertyOptional({
    description: 'Date de dernier inventaire maximum',
    type: 'string',
    format: 'date-time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateDernierInventaireMax?: Date

  @ApiPropertyOptional({
    description: 'Nombre de jours sans mouvement',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  joursSansMouvement?: number

  @ApiPropertyOptional({
    description: 'Âge du stock en jours',
    example: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ageStockJours?: number

  @ApiPropertyOptional({
    description: 'Valeur de stock minimum',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  valeurStockMin?: number

  @ApiPropertyOptional({
    description: 'Valeur de stock maximum',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  valeurStockMax?: number
}
