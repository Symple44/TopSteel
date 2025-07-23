import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { QueryBuilder } from './query-builder.entity'

@Entity('query_builder_calculated_fields')
export class QueryBuilderCalculatedField {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne(() => QueryBuilder, queryBuilder => queryBuilder.calculatedFields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: QueryBuilder

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