import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import type { WebhookEventType } from '../types/webhook.types'

@Entity('webhook_events')
@Index(['societeId', 'type', 'timestamp'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { length: 50 })
  type!: WebhookEventType

  @Column('uuid')
  societeId!: string

  @Column('jsonb')
  data!: Record<string, any>

  @Column('jsonb', { nullable: true })
  metadata?: {
    articleId?: string
    ruleId?: string
    userId?: string
    channel?: string
    previousValue?: number
    newValue?: number
    changePercent?: number
  }

  @CreateDateColumn({ type: 'timestamptz', name: 'timestamp' })
  timestamp!: Date
}
