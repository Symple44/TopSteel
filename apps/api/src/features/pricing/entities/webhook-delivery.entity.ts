import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { WebhookEvent } from './webhook-event.entity'
import { WebhookSubscription } from './webhook-subscription.entity'

export type DeliveryStatus = 'pending' | 'success' | 'failed'

export interface WebhookResponse {
  statusCode: number
  body?: string
  error?: string
}

@Entity('webhook_deliveries')
@Index(['subscriptionId'])
@Index(['eventId'])
@Index(['status'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  subscriptionId!: string

  @ManyToOne(() => WebhookSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: WebhookSubscription

  @Column('uuid')
  eventId!: string

  @ManyToOne(() => WebhookEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: WebhookEvent

  @Column('varchar', { length: 500 })
  url!: string

  @Column('varchar', { length: 20, default: 'pending' })
  status!: DeliveryStatus

  @Column('integer', { default: 0 })
  attempts!: number

  @Column('timestamptz', { nullable: true })
  lastAttempt?: Date

  @Column('jsonb', { nullable: true })
  response?: WebhookResponse

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
