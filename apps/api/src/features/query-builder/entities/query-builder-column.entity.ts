import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

// Type forward reference pour éviter les imports circulaires
interface QueryBuilderEntity {
  id: string
  name: string
  mainTable: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

@Entity('query_builder_columns')
export class QueryBuilderColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne('QueryBuilder', 'columns', {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: Promise<QueryBuilderEntity>

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
