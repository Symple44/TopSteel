import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../core/database/entities/base/multi-tenant.entity'

export enum MaterialType {
  ACIER = 'ACIER',
  INOX = 'INOX',
  ALUMINIUM = 'ALUMINIUM',
  CUIVRE = 'CUIVRE',
  LAITON = 'LAITON',
  BRONZE = 'BRONZE',
  ZINC = 'ZINC',
  PLASTIQUE = 'PLASTIQUE',
  COMPOSITE = 'COMPOSITE',
  AUTRE = 'AUTRE',
}

export enum MaterialForm {
  PLAQUE = 'PLAQUE',
  TUBE = 'TUBE',
  BARRE = 'BARRE',
  PROFILE = 'PROFILE',
  TOLE = 'TOLE',
  FIL = 'FIL',
  BOBINE = 'BOBINE',
  AUTRE = 'AUTRE',
}

/**
 * Matériaux standards partagés entre sociétés
 * Stocké dans la base SHARED
 */
@Entity('shared_materials')
@Index(['code', 'type'])
export class SharedMaterial extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string // Code unique du matériau (ex: ACIER_S235JR)

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: MaterialType,
  })
  @Index()
  type!: MaterialType

  @Column({
    type: 'enum',
    enum: MaterialForm,
  })
  @Index()
  forme!: MaterialForm

  // Caractéristiques techniques
  @Column({ type: 'jsonb', default: {} })
  caracteristiques!: {
    densite?: number // kg/m³
    resistanceTraction?: number // MPa
    limiteElastique?: number // MPa
    durete?: string // HB, HRC, etc.
    temperatureFusion?: number // °C
    conductiviteThermique?: number // W/(m·K)
    moduleYoung?: number // GPa
    coefficientPoisson?: number
    allongementRupture?: number // %
  }

  // Normes et certifications
  @Column({ type: 'jsonb', default: {} })
  normes!: {
    europeennes?: string[] // EN 10025, etc.
    americaines?: string[] // ASTM, AISI
    internationales?: string[] // ISO
    certifications?: string[]
  }

  // Dimensions standards disponibles
  @Column({ type: 'jsonb', default: {} })
  dimensionsStandards!: {
    epaisseurs?: number[] // mm
    largeurs?: number[] // mm
    longueurs?: number[] // mm
    diametres?: number[] // mm
    sections?: string[] // Pour les profilés
  }

  // Composition chimique
  @Column({ type: 'jsonb', nullable: true })
  compositionChimique?: {
    [element: string]: {
      min?: number // %
      max?: number // %
      typique?: number // %
    }
  }

  // Traitements possibles
  @Column({ type: 'jsonb', default: {} })
  traitements!: {
    thermiques?: string[]
    surface?: string[]
    mecanique?: string[]
  }

  // Applications typiques
  @Column({ type: 'simple-array', nullable: true })
  applications?: string[]

  // Données commerciales de référence
  @Column({ type: 'jsonb', default: {} })
  donneesCommerciales!: {
    uniteVente?: string // kg, m², ml, pièce
    poidsMoyenUnite?: number // kg
    conditionnementStandard?: string
    delaiApprovisionnement?: number // jours
  }

  // Fournisseurs de référence (sans prix)
  @Column({ type: 'jsonb', nullable: true })
  fournisseursReference?: {
    principaux?: string[]
    alternatifs?: string[]
  }

  // Métadonnées pour recherche et filtrage
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}
