import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Role } from '../../../domains/auth/core/entities/role.entity'
import { User } from '../../../domains/users/entities/user.entity'
// Removed import to avoid circular dependencies
// import { QueryBuilder } from './query-builder.entity'

export type PermissionType = 'view' | 'edit' | 'delete' | 'execute' | 'share' | 'export'

@Entity('query_builder_permissions')
export class QueryBuilderPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne('QueryBuilder', 'permissions', {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: any

  @Column()
  permissionType: PermissionType

  @Column({ nullable: true })
  userId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ nullable: true })
  roleId: string

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role

  @Column({ default: true })
  isAllowed: boolean
}
