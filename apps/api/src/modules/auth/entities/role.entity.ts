import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm'
import { UserRole } from './user-role.entity'
import { RolePermission } from './role-permission.entity'

@Entity('roles')
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'boolean', default: false })
  @Index()
  isSystemRole!: boolean

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Relations
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles!: UserRole[]

  @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
  permissions!: RolePermission[]

  // Méthodes utilitaires
  static createSystemRole(name: string, description: string): Role {
    const role = new Role()
    role.name = name
    role.description = description
    role.isSystemRole = true
    role.isActive = true
    return role
  }

  static createCustomRole(name: string, description: string, createdBy: string): Role {
    const role = new Role()
    role.name = name
    role.description = description
    role.isSystemRole = false
    role.isActive = true
    role.createdBy = createdBy
    return role
  }

  canBeDeleted(): boolean {
    return !this.isSystemRole
  }

  canBeModified(): boolean {
    return !this.isSystemRole
  }
}