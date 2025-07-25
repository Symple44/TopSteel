import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm'
import { RolePermission } from './role-permission.entity'

export enum AccessLevel {
  BLOCKED = 'BLOCKED',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN'
}

@Entity('permissions', { schema: 'public' })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50, name: 'module' })
  @Index()
  moduleId!: string

  @Column({ type: 'varchar', length: 50 })
  action!: string

  @Column({ type: 'varchar', length: 100, name: 'nom' })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Relations
  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions!: RolePermission[]

  // Méthodes utilitaires
  static createSystemPermission(
    moduleId: string,
    action: string,
    name: string,
    description: string
  ): Permission {
    const permission = new Permission()
    permission.moduleId = moduleId
    permission.action = action
    permission.name = name
    permission.description = description
    return permission
  }

  getPermissionKey(): string {
    return `${this.moduleId}_${this.action}`.toUpperCase()
  }
}