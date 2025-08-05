import { Column, Entity, Index, OneToMany } from 'typeorm'
import { CommonEntity } from '../base/multi-tenant.entity'

export enum SocieteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

export enum SocietePlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

@Entity('societes')
export class Societe extends CommonEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  code!: string // Code unique pour la société (ex: TOPSTEEL, METALUX, etc.)

  @Column({ type: 'varchar', length: 20, nullable: true })
  siret?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  tva?: string

  @Column({ type: 'text', nullable: true })
  adresse?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  codePostal?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  pays?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string

  @Column({
    type: 'enum',
    enum: SocieteStatus,
    default: SocieteStatus.TRIAL,
  })
  @Index()
  status!: SocieteStatus

  @Column({
    type: 'enum',
    enum: SocietePlan,
    default: SocietePlan.STARTER,
  })
  plan!: SocietePlan

  // Configuration de la base de données dédiée
  @Column({ type: 'varchar', length: 100 })
  databaseName!: string // Nom de la BDD dédiée (ex: erp_topsteel_societe_a)

  @Column({ type: 'varchar', length: 100, nullable: true })
  databaseHost?: string // Si différent du host principal

  @Column({ type: 'integer', nullable: true })
  databasePort?: number // Si différent du port principal

  // Limites et quotas
  @Column({ type: 'integer', default: 5 })
  maxUsers!: number

  @Column({ type: 'integer', default: 1 })
  maxSites!: number

  @Column({ type: 'bigint', nullable: true })
  maxStorageBytes?: number

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateActivation?: Date

  @Column({ type: 'date', nullable: true })
  dateExpiration?: Date

  // Configuration et préférences
  @Column({ type: 'jsonb', default: {} })
  configuration!: {
    modules?: string[] // Modules activés
    features?: string[] // Fonctionnalités spécifiques
    theme?: Record<string, any>
    locale?: string
    timezone?: string
    marketplace?: {
      enabled?: boolean
      storeName?: string
      description?: string
      domain?: string
      logo?: string
      favicon?: string
      phone?: string
      allowGuestCheckout?: boolean
      requiresAuth?: boolean
      showPrices?: boolean
      showStock?: boolean
      enableWishlist?: boolean
      enableCompare?: boolean
      enableReviews?: boolean
      social?: Record<string, string>
      settings?: Record<string, any>
    }
  }

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}
