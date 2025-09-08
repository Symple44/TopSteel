import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

// Removed direct imports to avoid circular dependencies
// import { Role } from './role.entity'
// import type { UserGroup } from './user-group.entity'

// Type definitions to avoid circular dependencies
type Role = {
  id: string
  name: string
  // Other Role properties would be here
}

type UserGroup = {
  id: string
  userId: string
  groupId: string
  // Other UserGroup properties would be here
}

@Entity('groups')
@Index(['name'], { unique: true })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Relations
  @OneToMany('UserGroup', 'group', { lazy: true })
  userGroups!: UserGroup[]

  @ManyToMany('Role', 'groups', { lazy: true })
  @JoinTable({
    name: 'group_roles',
    joinColumn: {
      name: 'groupId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'roleId',
      referencedColumnName: 'id',
    },
  })
  roles!: Role[]

  // Méthodes utilitaires
  static create(
    name: string,
    description: string,
    type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM',
    createdBy: string
  ): Group {
    const group = new Group()
    group.name = name
    group.description = description
    group.type = type
    group.isActive = true
    group.createdBy = createdBy
    return group
  }
}
