import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../../domains/users/entities/user.entity'
// Removed imports to avoid circular dependencies
// import { QueryBuilderCalculatedField } from './query-builder-calculated-field.entity'
// import { QueryBuilderColumn } from './query-builder-column.entity'
// import { QueryBuilderJoin } from './query-builder-join.entity'
// import { QueryBuilderPermission } from './query-builder-permission.entity'

@Entity('query_builders')
@Index(['createdById', 'isPublic']) // For user's public/private queries
@Index(['database', 'mainTable']) // For database table queries
@Index(['isPublic', 'createdAt']) // For public query discovery
@Index(['name']) // For query name searches
@Index(['createdAt']) // For chronological queries
export class QueryBuilder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index() // Index for query name searches
  name: string

  @Column({ nullable: true })
  description: string

  @Column()
  @Index() // Index for database-specific queries
  database: string

  @Column()
  @Index() // Index for table-specific queries
  mainTable: string

  @Column({ default: false })
  @Index() // Index for public/private filtering
  isPublic: boolean

  @Column({ nullable: true, type: 'int' })
  maxRows: number | null

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for settings queries
  settings: {
    enablePagination?: boolean
    pageSize?: number
    enableSorting?: boolean
    enableFiltering?: boolean
    enableExport?: boolean
    exportFormats?: string[]
  }

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for layout queries
  layout: {
    columns?: Array<{
      id: string
      order: number
      width?: number
      visible: boolean
    }>
  }

  @Column()
  @Index() // Index for user-specific queries
  createdById: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @OneToMany('QueryBuilderColumn', 'queryBuilder', {
    cascade: true,
    lazy: true,
  })
  columns: unknown[]

  @OneToMany('QueryBuilderJoin', 'queryBuilder', {
    cascade: true,
    lazy: true,
  })
  joins: unknown[]

  @OneToMany('QueryBuilderCalculatedField', 'queryBuilder', {
    cascade: true,
    lazy: true,
  })
  calculatedFields: unknown[]

  @OneToMany('QueryBuilderPermission', 'queryBuilder', {
    cascade: true,
    lazy: true,
  })
  permissions: unknown[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
