import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { QueryBuilder } from './query-builder.entity'

@Entity('query_builder_columns')
export class QueryBuilderColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne(
    () => QueryBuilder,
    (queryBuilder) => queryBuilder.columns,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: QueryBuilder

  @Column()
  tableName: string

  @Column()
  columnName: string

  @Column()
  alias: string

  @Column()
  label: string

  @Column({ nullable: true })
  description: string

  @Column()
  dataType: string

  @Column({ default: false })
  isPrimaryKey: boolean

  @Column({ default: false })
  isForeignKey: boolean

  @Column({ default: true })
  isVisible: boolean

  @Column({ default: true })
  isFilterable: boolean

  @Column({ default: true })
  isSortable: boolean

  @Column({ default: false })
  isGroupable: boolean

  @Column({ type: 'int' })
  displayOrder: number

  @Column({ nullable: true, type: 'int' })
  width: number

  @Column({ type: 'jsonb', nullable: true })
  format: {
    type?: 'date' | 'number' | 'currency' | 'percentage' | 'boolean' | 'custom'
    pattern?: string
    prefix?: string
    suffix?: string
    decimals?: number
  }

  @Column({ type: 'jsonb', nullable: true })
  aggregation: {
    enabled?: boolean
    type?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  }
}
