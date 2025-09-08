import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { CommonEntity } from '../../../../core/database/entities/base/multi-tenant.entity'
import { ParameterSystem } from '../../../../features/parameters/entities/parameter-system.entity'
import { Societe } from '../../../../features/societes/entities/societe.entity'

// Type definitions to avoid circular dependencies
type RolePermission = {
  id: string
  roleId: string
  permissionId: string
  // Other RolePermission properties
}

type UserRole = {
  id: string
  userId: string
  roleId: string
  // Other UserRole properties
}

/**
 * Table roles
 * Représente les rôles spécifiques à une société avec héritage d'un rôle parent système
 */
@Entity('roles')
@Index(['name', 'societeId']) // Composite index for role lookup by name and organization
@Index(['societeId', 'isActive']) // For active roles in organization
@Index(['parentRoleType']) // For role hierarchy queries
@Index(['isSystemRole', 'isActive']) // For system role filtering
@Index(['priority']) // For role priority ordering
export class Role extends CommonEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index() // Index for role name lookups
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  @Index()
  societeId?: string

  @ManyToOne(() => Societe, { nullable: true })
  @JoinColumn({ name: 'societe_id' })
  societe?: Societe

  @Column({ name: 'parent_role_type', type: 'varchar', length: 50, nullable: true })
  @Index()
  parentRoleType?: string

  @ManyToOne(() => ParameterSystem, { nullable: true })
  @JoinColumn({ name: 'parent_role_type', referencedColumnName: 'key' })
  parentRole?: ParameterSystem

  @Column({ name: 'actif', type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'jsonb', default: {} })
  @Index() // GIN index for metadata queries
  metadata?: Record<string, unknown>

  @OneToMany('RolePermission', (rp: RolePermission) => rp.roleId)
  rolePermissions!: RolePermission[]

  @OneToMany('UserRole', (ur: UserRole) => ur.roleId)
  userRoles!: UserRole[]

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Index() // Index for priority-based ordering
  priority!: number // Plus élevé = plus de priorité

  @Column({ name: 'isSystemRole', type: 'boolean', default: false })
  @Index() // Index for system role filtering
  isSystemRole!: boolean // Pour compatibilité avec les services existants

  // Méthodes pour compatibilité
  static createSystemRole(name: string, description: string): Role {
    const role = new Role()
    role.name = name
    role.description = description
    role.isSystemRole = true
    role.isActive = true
    role.priority = 0
    role.metadata = {}
    return role
  }

  static createCustomRole(name: string, description: string): Role {
    const role = new Role()
    role.name = name
    role.description = description
    role.isSystemRole = false
    role.isActive = true
    role.priority = 100
    role.metadata = {}
    return role
  }
}
