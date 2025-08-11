import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'

@Entity('sales_history')
@Index(['articleId', 'date'])
@Index(['societeId', 'date'])
@Index(['customerId', 'date'])
export class SalesHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  societeId!: string

  @Column('uuid')
  articleId!: string

  @Column('uuid', { nullable: true })
  customerId?: string

  @Column('date')
  date!: Date

  @Column('decimal', { precision: 12, scale: 4 })
  price!: number

  @Column('decimal', { precision: 10, scale: 3 })
  quantity!: number

  @Column('decimal', { precision: 15, scale: 4 })
  revenue!: number

  @Column('decimal', { precision: 12, scale: 4, nullable: true })
  cost?: number

  @Column('varchar', { length: 20, default: 'ERP' })
  channel!: string

  @Column('jsonb', { nullable: true })
  metadata?: {
    promotionCode?: string
    discountApplied?: number
    customerGroup?: string
    region?: string
    salesperson?: string
  }

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}