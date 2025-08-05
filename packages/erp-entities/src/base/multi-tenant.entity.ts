import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm'

/**
 * Entité de base pour toutes les tables
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date

  @VersionColumn({ default: 1 })
  version!: number
}

/**
 * Entité de base avec audit trail
 */
export abstract class BaseAuditEntity extends BaseEntity {
  @Column({ name: 'created_by_id', nullable: true, type: 'uuid' })
  createdById?: string

  @Column({ name: 'updated_by_id', nullable: true, type: 'uuid' })
  updatedById?: string

  @Column({ name: 'deleted_by_id', nullable: true, type: 'uuid' })
  deletedById?: string
}

/**
 * Entité de base pour les données communes (base commune)
 */
export abstract class CommonEntity extends BaseAuditEntity {
  // Pas de société_id car données communes
}

/**
 * Entité de base pour les données spécifiques à une société
 */
export abstract class TenantEntity extends BaseAuditEntity {
  @Column({ name: 'societe_id', type: 'uuid' })
  societeId!: string

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId?: string
}

/**
 * Entité de base pour les données partageables entre sociétés
 */
export abstract class ShareableEntity extends BaseAuditEntity {
  @Column({ name: 'owner_societe_id', type: 'uuid' })
  ownerSocieteId!: string

  @Column({ name: 'shared_with', type: 'uuid', array: true, default: [] })
  sharedWith!: string[] // IDs des sociétés avec qui c'est partagé

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean // Accessible à toutes les sociétés
}

/**
 * Interface pour le contexte de société
 */
export interface ITenantContext {
  societeId: string
  siteId?: string
  userId: string
}