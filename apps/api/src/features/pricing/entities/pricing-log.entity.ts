import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('pricing_logs')
@Index(['societeId', 'createdAt'])
@Index(['ruleId'])
@Index(['articleId', 'customerId'])
@Index(['channel', 'applied'])
export class PricingLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  societeId!: string

  @Column('uuid', { nullable: true })
  ruleId?: string

  @Column('uuid', { nullable: true })
  articleId?: string

  @Column('uuid', { nullable: true })
  customerId?: string

  @Column('varchar', { length: 50, nullable: true })
  customerGroup?: string

  @Column('varchar', { length: 20, default: 'ERP' })
  channel!: string

  @Column('decimal', { precision: 12, scale: 4, default: 0 })
  basePrice!: number

  @Column('decimal', { precision: 12, scale: 4, default: 0 })
  finalPrice!: number

  @Column('decimal', { precision: 12, scale: 4, default: 0 })
  discount!: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercentage!: number

  @Column('decimal', { precision: 10, scale: 3, default: 1 })
  quantity!: number

  @Column('integer', { default: 0 })
  calculationTime!: number // milliseconds

  @Column('boolean', { default: false })
  applied!: boolean

  @Column('varchar', { length: 255, nullable: true })
  reason?: string

  @Column('boolean', { default: false })
  cacheHit!: boolean

  @Column('text', { nullable: true })
  error?: string

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
