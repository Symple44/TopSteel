import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm'
import { UserRole } from './user-role.entity'
import { RolePermission } from './role-permission.entity'

@Entity('roles', { schema: 'public' })
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true, name: 'nom' })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'boolean', default: false })
  @Index()
  isSystemRole!: boolean

  @Column({ type: 'boolean', default: true, name: 'actif' })
  @Index()
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

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

  static createCustomRole(name: string, description: string): Role {
    const role = new Role()
    role.name = name
    role.description = description
    role.isSystemRole = false
    role.isActive = true
    return role
  }

  canBeDeleted(): boolean {
    return !this.isSystemRole
  }

  canBeModified(): boolean {
    return !this.isSystemRole
  }
}