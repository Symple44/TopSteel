import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { CommonEntity } from '../../../../core/database/entities/base/multi-tenant.entity'
import { Societe } from '../../../../features/societes/entities/societe.entity'
import { RolePermission } from './role-permission.entity'

export enum AccessLevel {
  BLOCKED = 'BLOCKED',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
}

/**
 * Table permissions
 * Représente les permissions disponibles, globales ou spécifiques à une société
 */
@Entity('permissions')
export class Permission extends CommonEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index()
  name!: string

  @Column({ type: 'varchar', length: 255 })
  @Index()
  resource!: string // Ex: 'users', 'projects', 'billing'

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action!: string // Ex: 'read', 'write', 'delete', 'admin'

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  societeId?: string // null = permission globale

  @ManyToOne(() => Societe, { nullable: true })
  @JoinColumn({ name: 'societeId' })
  societe?: Societe

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'jsonb', default: {} })
  metadata?: Record<string, unknown>

  @OneToMany(
    () => RolePermission,
    (rp) => rp.permission
  )
  rolePermissions!: RolePermission[]

  @Column({ type: 'varchar', length: 50, default: 'application' })
  @Index()
  scope!: string // 'system', 'application', 'tenant'

  // Alias pour compatibilité avec l'ancien système
  get module(): string {
    return this.resource
  }
}
