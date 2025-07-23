import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { QueryBuilder } from './query-builder.entity'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

@Entity('query_builder_joins')
export class QueryBuilderJoin {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne(() => QueryBuilder, queryBuilder => queryBuilder.joins, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: QueryBuilder

  @Column()
  fromTable: string

  @Column()
  fromColumn: string

  @Column()
  toTable: string

  @Column()
  toColumn: string

  @Column()
  joinType: JoinType

  @Column()
  alias: string

  @Column({ type: 'int' })
  order: number
}