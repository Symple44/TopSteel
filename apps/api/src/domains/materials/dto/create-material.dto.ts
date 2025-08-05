import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator'
import {
  MaterialType,
  MaterialShape,
  MaterialStatus,
  MaterialUnit,
  StorageMethod,
  type MaterialDimensions,
  type MechanicalProperties,
  type PhysicalProperties,
  type ChemicalProperties,
  type MaterialCertifications,
  type SupplyInfo,
  type ProductionInfo,
} from '../entities/material.entity'

/**
 * DTO pour la création d'un matériau
 */
export class CreateMaterialDto {
  @ApiPropertyOptional({
    description: 'Référence unique du matériau (générée automatiquement si non fournie)',
    example: 'AC-PL-000001',
  })
  @IsOptional()
  @IsString()
  reference?: string

  @ApiProperty({
    description: 'Nom descriptif du matériau',
    example: 'Plaque acier S235JR',
  })
  @IsNotEmpty()
  @IsString()
  nom!: string

  @ApiPropertyOptional({
    description: 'Description détaillée du matériau',
    example: "Plaque d'acier de construction selon norme EN 10025-2",
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'Type de matériau',
    enum: MaterialType,
    example: MaterialType.ACIER,
  })
  @IsEnum(MaterialType)
  type!: MaterialType

  @ApiProperty({
    description: 'Forme du matériau',
    enum: MaterialShape,
    example: MaterialShape.PLAQUE,
  })
  @IsEnum(MaterialShape)
  forme!: MaterialShape

  @ApiPropertyOptional({
    description: 'Statut du matériau',
    enum: MaterialStatus,
    default: MaterialStatus.ACTIF,
  })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus

  @ApiPropertyOptional({
    description: 'Nuance du matériau',
    example: 'S235JR',
  })
  @IsOptional()
  @IsString()
  nuance?: string

  @ApiPropertyOptional({
    description: 'Qualité du matériau',
    example: 'Qualité commerciale',
  })
  @IsOptional()
  @IsString()
  qualite?: string

  @ApiPropertyOptional({
    description: 'Marque du matériau',
    example: 'ArcelorMittal',
  })
  @IsOptional()
  @IsString()
  marque?: string

  @ApiPropertyOptional({
    description: 'Modèle du matériau',
    example: 'Standard',
  })
  @IsOptional()
  @IsString()
  modele?: string

  @ApiPropertyOptional({
    description: 'Dimensions du matériau',
    type: 'object',
    additionalProperties: true,
    example: {
      longueur: 2000,
      largeur: 1000,
      epaisseur: 10,
      tolerances: {
        longueur: '±5mm',
        largeur: '±3mm',
        epaisseur: '±0.5mm',
      },
    },
  })
  @IsOptional()
  @IsObject()
  dimensions?: MaterialDimensions

  @ApiPropertyOptional({
    description: 'Poids unitaire en kg',
    example: 157.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsUnitaire?: number

  @ApiPropertyOptional({
    description: 'Densité en g/cm³',
    example: 7.85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  densite?: number

  @ApiProperty({
    description: 'Unité de mesure',
    enum: MaterialUnit,
    example: MaterialUnit.KG,
  })
  @IsEnum(MaterialUnit)
  unite!: MaterialUnit

  @ApiPropertyOptional({
    description: 'Prix unitaire',
    example: 1250.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number

  @ApiPropertyOptional({
    description: 'Devise',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  devise?: string

  @ApiPropertyOptional({
    description: 'Stock minimum',
    example: 10.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMini?: number

  @ApiPropertyOptional({
    description: 'Stock maximum',
    example: 100.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMaxi?: number

  @ApiPropertyOptional({
    description: 'Stock physique initial',
    example: 50.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockPhysique?: number

  @ApiPropertyOptional({
    description: 'Stock réservé initial',
    example: 5.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockReserve?: number

  @ApiPropertyOptional({
    description: 'Emplacement de stockage',
    example: 'A-01-15',
  })
  @IsOptional()
  @IsString()
  emplacement?: string

  @ApiPropertyOptional({
    description: 'Méthode de stockage',
    enum: StorageMethod,
    default: StorageMethod.STANDARD,
  })
  @IsOptional()
  @IsEnum(StorageMethod)
  methodeStockage?: StorageMethod

  @ApiPropertyOptional({
    description: 'Propriétés mécaniques',
    type: 'object',
    additionalProperties: true,
    example: {
      limiteElastique: 235,
      resistanceTraction: 360,
      durete: 120,
      moduleElasticite: 210,
      allongement: 26,
    },
  })
  @IsOptional()
  @IsObject()
  proprietesMecaniques?: MechanicalProperties

  @ApiPropertyOptional({
    description: 'Propriétés physiques',
    type: 'object',
    additionalProperties: true,
    example: {
      densite: 7.85,
      pointFusion: 1530,
      conductiviteThermique: 50,
      capaciteThermique: 490,
    },
  })
  @IsOptional()
  @IsObject()
  proprietesPhysiques?: PhysicalProperties

  @ApiPropertyOptional({
    description: 'Propriétés chimiques',
    type: 'object',
    additionalProperties: true,
    example: {
      composition: {
        Fe: 99.0,
        C: 0.17,
        Mn: 1.4,
        P: 0.035,
        S: 0.035,
      },
      resistanceCorrosion: 'Faible',
      traitementThermique: ['Normalisation'],
    },
  })
  @IsOptional()
  @IsObject()
  proprietesChimiques?: ChemicalProperties

  @ApiPropertyOptional({
    description: 'Certifications et normes',
    type: 'object',
    additionalProperties: true,
    example: {
      normes: ['EN 10025-2', 'NF A35-501'],
      certifications: ['CE'],
      attestations: ['3.1'],
      classifications: ['S235JR'],
    },
  })
  @IsOptional()
  @IsObject()
  certifications?: MaterialCertifications

  @ApiPropertyOptional({
    description: "Informations d'approvisionnement",
    type: 'object',
    additionalProperties: true,
    example: {
      fournisseurPrincipalId: 'uuid-fournisseur',
      referenceFournisseur: 'REF-FOUR-001',
      delaiLivraison: 15,
      quantiteMiniCommande: 100,
      quantiteMultiple: 10,
    },
  })
  @IsOptional()
  @IsObject()
  informationsApprovisionnement?: SupplyInfo

  @ApiPropertyOptional({
    description: 'Informations de production',
    type: 'object',
    additionalProperties: true,
    example: {
      procédésFabrication: ['Laminage à chaud'],
      outilsSpeciaux: ['Cisaille'],
      tempsUsinage: 30,
      rebuts: 2,
    },
  })
  @IsOptional()
  @IsObject()
  informationsProduction?: ProductionInfo

  @ApiPropertyOptional({
    description: 'Matériau dangereux',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dangereux?: boolean

  @ApiPropertyOptional({
    description: 'Classe de danger si applicable',
    example: 'H260',
  })
  @IsOptional()
  @IsString()
  classeDanger?: string

  @ApiPropertyOptional({
    description: 'Précautions de manipulation',
    example: 'Porter des EPI appropriés',
  })
  @IsOptional()
  @IsString()
  precautionsManipulation?: string

  @ApiPropertyOptional({
    description: 'Matériau obsolète',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  obsolete?: boolean

  @ApiPropertyOptional({
    description: 'Référence du matériau de remplacement',
    example: 'AC-PL-000002',
  })
  @IsOptional()
  @IsString()
  remplacePar?: string

  @ApiPropertyOptional({
    description: 'Notes diverses',
    example: 'Matériau de qualité supérieure',
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({
    description: 'ID du matériau partagé (référentiel commun)',
    example: 'uuid-shared-material',
  })
  @IsOptional()
  @IsString()
  sharedMaterialId?: string

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    type: 'object',
    additionalProperties: true,
    example: {
      fournisseurSecondaire: 'uuid-autre-fournisseur',
      notesInternes: 'Matériau testé et approuvé',
    },
  })
  @IsOptional()
  @IsObject()
  metadonnees?: Record<string, any>
}
