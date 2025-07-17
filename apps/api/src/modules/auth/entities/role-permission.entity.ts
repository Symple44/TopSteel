import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Role } from './role.entity'
import { Permission, AccessLevel } from './permission.entity'

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  roleId!: string

  @Column({ type: 'uuid' })
  @Index()
  permissionId!: string

  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.READ })
  accessLevel!: AccessLevel

  @Column({ type: 'boolean', default: true })
  isGranted!: boolean

  @Column({ type: 'json', nullable: true })
  conditions?: Record<string, any>

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  grantedBy?: string

  // Relations
  @ManyToOne(() => Role, role => role.permissions)
  @JoinColumn({ name: 'roleId' })
  role!: Role

  @ManyToOne(() => Permission, permission => permission.rolePermissions)
  @JoinColumn({ name: 'permissionId' })
  permission!: Permission

  // Méthodes utilitaires
  static create(
    roleId: string,
    permissionId: string,
    accessLevel: AccessLevel,
    isGranted: boolean = true,
    grantedBy?: string
  ): RolePermission {
    const rolePermission = new RolePermission()
    rolePermission.roleId = roleId
    rolePermission.permissionId = permissionId
    rolePermission.accessLevel = accessLevel
    rolePermission.isGranted = isGranted
    rolePermission.grantedBy = grantedBy
    return rolePermission
  }

  hasAccessLevel(requiredLevel: AccessLevel): boolean {
    if (!this.isGranted) return false
    
    const levels = [AccessLevel.BLOCKED, AccessLevel.READ, AccessLevel.WRITE, AccessLevel.DELETE, AccessLevel.ADMIN]
    const currentIndex = levels.indexOf(this.accessLevel)
    const requiredIndex = levels.indexOf(requiredLevel)
    
    return currentIndex >= requiredIndex
  }
}