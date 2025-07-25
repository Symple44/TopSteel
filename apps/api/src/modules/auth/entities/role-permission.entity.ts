import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Role } from './role.entity'
import { Permission } from './permission.entity'

@Entity('role_permissions', { schema: 'public' })
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'role_id' })
  @Index()
  roleId!: string

  @Column({ type: 'uuid', name: 'permission_id' })
  @Index()
  permissionId!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Relations
  @ManyToOne(() => Role, role => role.permissions)
  @JoinColumn({ name: 'role_id' })
  role!: Role

  @ManyToOne(() => Permission, permission => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission

  // Méthodes utilitaires
  static create(
    roleId: string,
    permissionId: string
  ): RolePermission {
    const rolePermission = new RolePermission()
    rolePermission.roleId = roleId
    rolePermission.permissionId = permissionId
    return rolePermission
  }

}