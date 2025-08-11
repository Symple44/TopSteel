import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { 
  WebhookEventType, 
  WebhookRetryPolicy, 
  WebhookFilters, 
  WebhookMetadata 
} from '../types/webhook.types'

@Entity('webhook_subscriptions')
@Index(['societeId', 'isActive'])
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  societeId!: string

  @Column('varchar', { length: 500 })
  url!: string

  @Column('varchar', { length: 128 })
  secret!: string

  @Column('jsonb', { default: [] })
  events!: WebhookEventType[]

  @Column('boolean', { default: true })
  isActive!: boolean

  @Column('jsonb', { nullable: true })
  filters?: WebhookFilters

  @Column('jsonb', { 
    default: () => `'{"maxRetries": 3, "retryDelay": 1000, "backoffMultiplier": 2}'` 
  })
  retryPolicy!: WebhookRetryPolicy

  @Column('jsonb', { 
    nullable: true,
    default: () => `'{"totalCalls": 0, "successRate": 100}'`
  })
  metadata?: WebhookMetadata

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}