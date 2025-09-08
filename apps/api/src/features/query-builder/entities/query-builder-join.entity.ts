import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
// Removed import to avoid circular dependencies
// import { QueryBuilder } from './query-builder.entity'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

@Entity('query_builder_joins')
export class QueryBuilderJoin {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queryBuilderId: string

  @ManyToOne('QueryBuilder', 'joins', {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'queryBuilderId' })
  queryBuilder: any

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
