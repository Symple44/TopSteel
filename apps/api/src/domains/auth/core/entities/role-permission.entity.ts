import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { CommonEntity } from '../../../../core/database/entities/base/multi-tenant.entity'

// Type definitions to avoid circular dependencies
type Role = {
  id: string
  name: string
  // Other Role properties would be here
}

type Permission = {
  id: string
  name: string
  // Other Permission properties would be here
}

/**
 * Table role_permissions
 * Table de liaison entre rôles et permissions avec configuration d'accès
 */
@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission extends CommonEntity {
  @Column({ type: 'uuid' })
  @Index()
  roleId!: string

  @ManyToOne('Role')
  @JoinColumn({ name: 'roleId' })
  role!: Role

  @Column({ type: 'uuid' })
  @Index()
  permissionId!: string

  @ManyToOne('Permission')
  @JoinColumn({ name: 'permissionId' })
  permission!: Permission

  @Column({ type: 'boolean', default: true })
  isGranted!: boolean

  @Column({
    type: 'enum',
    enum: ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN'],
    default: 'READ',
  })
  accessLevel!: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'

  @Column({ type: 'jsonb', default: {} })
  conditions?: Record<string, unknown> // Conditions spécifiques (ex: horaires, IP, etc.)

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  // Méthode pour compatibilité
  static create(roleId: string, permissionId: string): RolePermission {
    const rp = new RolePermission()
    rp.roleId = roleId
    rp.permissionId = permissionId
    rp.isGranted = true
    rp.accessLevel = 'READ'
    rp.isActive = true
    rp.conditions = {}
    return rp
  }
}
