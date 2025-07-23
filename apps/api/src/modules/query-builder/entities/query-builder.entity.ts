import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { QueryBuilderColumn } from './query-builder-column.entity'
import { QueryBuilderJoin } from './query-builder-join.entity'
import { QueryBuilderCalculatedField } from './query-builder-calculated-field.entity'
import { QueryBuilderPermission } from './query-builder-permission.entity'

@Entity('query_builders')
export class QueryBuilder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column()
  database: string

  @Column()
  mainTable: string

  @Column({ default: false })
  isPublic: boolean

  @Column({ nullable: true, type: 'int' })
  maxRows: number | null

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    enablePagination?: boolean
    pageSize?: number
    enableSorting?: boolean
    enableFiltering?: boolean
    enableExport?: boolean
    exportFormats?: string[]
  }

  @Column({ type: 'jsonb', nullable: true })
  layout: {
    columns?: Array<{
      id: string
      order: number
      width?: number
      visible: boolean
    }>
  }

  @Column()
  createdById: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @OneToMany(() => QueryBuilderColumn, column => column.queryBuilder, {
    cascade: true,
  })
  columns: QueryBuilderColumn[]

  @OneToMany(() => QueryBuilderJoin, join => join.queryBuilder, {
    cascade: true,
  })
  joins: QueryBuilderJoin[]

  @OneToMany(() => QueryBuilderCalculatedField, field => field.queryBuilder, {
    cascade: true,
  })
  calculatedFields: QueryBuilderCalculatedField[]

  @OneToMany(() => QueryBuilderPermission, permission => permission.queryBuilder, {
    cascade: true,
  })
  permissions: QueryBuilderPermission[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}