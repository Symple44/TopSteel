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

@Entity('query_builder_calculated_fields')
export class QueryBuilderCalculatedField {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne('QueryBuilder', 'calculatedFields', {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: Promise<QueryBuilderEntity>

  @Column()
  name: string

  @Column()
  label: string

  @Column({ nullable: true })
  description: string

  @Column({ type: 'text' })
  expression: string

  @Column()
  dataType: string

  @Column({ default: true })
  isVisible: boolean

  @Column({ type: 'int' })
  displayOrder: number

  @Column({ type: 'jsonb', nullable: true })
  format: {
    type?: 'date' | 'number' | 'currency' | 'percentage' | 'boolean' | 'custom'
    pattern?: string
    prefix?: string
    suffix?: string
    decimals?: number
  }

  @Column({ type: 'jsonb', nullable: true })
  dependencies: string[]
}
