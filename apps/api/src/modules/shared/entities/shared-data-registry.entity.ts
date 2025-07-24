import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../database/entities/base/multi-tenant.entity'

export enum SharedDataType {
  MATERIAL = 'MATERIAL',           // Matériau standard
  PRODUCT_TEMPLATE = 'PRODUCT_TEMPLATE', // Modèle de produit
  PRICE_LIST = 'PRICE_LIST',       // Liste de prix
  SUPPLIER = 'SUPPLIER',           // Fournisseur commun
  DOCUMENT_TEMPLATE = 'DOCUMENT_TEMPLATE', // Modèle de document
  PROCESS = 'PROCESS',             // Processus de fabrication
  QUALITY_STANDARD = 'QUALITY_STANDARD', // Standard qualité
  OTHER = 'OTHER'
}

export enum ShareScope {
  PRIVATE = 'PRIVATE',           // Privé à la société propriétaire
  GROUP = 'GROUP',               // Partagé avec certaines sociétés
  PUBLIC = 'PUBLIC'              // Public pour toutes les sociétés
}

/**
 * Registre des données partagées dans la base AUTH
 * Pointe vers les données réelles dans la base SHARED
 */
@Entity('shared_data_registry')
@Index(['type', 'ownerSocieteId'])
export class SharedDataRegistry extends BaseAuditEntity {
  @Column({ type: 'uuid' })
  @Index()
  ownerSocieteId!: string

  @Column({ type: 'uuid', array: true, default: [] })
  sharedWithSocieteIds!: string[] // IDs des sociétés avec qui c'est partagé

  @Column({
    type: 'enum',
    enum: SharedDataType
  })
  @Index()
  type!: SharedDataType

  @Column({ type: 'varchar', length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: ShareScope,
    default: ShareScope.PRIVATE
  })
  @Index()
  shareScope!: ShareScope

  // Référence à l'entité réelle dans la base partagée
  @Column({ type: 'varchar', length: 100 })
  sharedEntityType!: string // Ex: 'SharedMaterial', 'SharedSupplier', etc.

  @Column({ type: 'uuid' })
  sharedEntityId!: string // ID de l'entité dans la base partagée

  // Configuration du partage
  @Column({ type: 'jsonb', default: {} })
  shareConfig!: {
    allowModification?: boolean // Les autres peuvent-ils modifier?
    allowCopy?: boolean        // Les autres peuvent-ils copier?
    expirationDate?: Date      // Date d'expiration du partage
    conditions?: string[]      // Conditions d'utilisation
    readOnly?: boolean         // Lecture seule pour les autres sociétés
  }

  // Statistiques d'utilisation
  @Column({ type: 'integer', default: 0 })
  usageCount!: number

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date

  @Column({ type: 'jsonb', nullable: true })
  usageStats?: {
    bySociete?: Record<string, number>
    byMonth?: Record<string, number>
  }

  // Métadonnées pour recherche
  @Column({ type: 'jsonb', default: {} })
  searchData!: {
    code?: string
    reference?: string
    tags?: string[]
    attributes?: Record<string, any>
  }
}