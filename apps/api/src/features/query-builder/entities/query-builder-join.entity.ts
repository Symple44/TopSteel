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
  queryBuilder: Promise<QueryBuilderEntity>

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
