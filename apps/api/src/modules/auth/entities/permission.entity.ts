import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm'
import { Module } from './module.entity'
import { RolePermission } from './role-permission.entity'

export enum AccessLevel {
  BLOCKED = 'BLOCKED',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN'
}

@Entity('permissions')
@Index(['moduleId', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  moduleId!: string

  @Column({ type: 'varchar', length: 100 })
  action!: string

  @Column({ type: 'varchar', length: 200 })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.READ })
  level!: AccessLevel

  @Column({ type: 'boolean', default: false })
  isRequired!: boolean

  @Column({ type: 'json', nullable: true })
  conditions?: Record<string, any>

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @ManyToOne(() => Module, module => module.permissions)
  @JoinColumn({ name: 'moduleId' })
  module!: Module

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions!: RolePermission[]

  // Méthodes utilitaires
  static createSystemPermission(
    moduleId: string,
    action: string,
    name: string,
    description: string,
    level: AccessLevel,
    isRequired: boolean = false
  ): Permission {
    const permission = new Permission()
    permission.moduleId = moduleId
    permission.action = action
    permission.name = name
    permission.description = description
    permission.level = level
    permission.isRequired = isRequired
    return permission
  }

  getPermissionKey(): string {
    return `${this.moduleId}_${this.action}`.toUpperCase()
  }
}