import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { TrackingStatus } from '../types/shipping.types'
import { MarketplaceOrder } from './marketplace-order.entity'

@Entity('marketplace_shipments')
export class MarketplaceShipment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id' })
  orderId: string

  @ManyToOne(() => MarketplaceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: MarketplaceOrder

  @Column({ name: 'carrier_name' })
  carrierName: string

  @Column({ name: 'tracking_number', unique: true })
  trackingNumber: string

  @Column({ name: 'tracking_url', nullable: true })
  trackingUrl?: string

  @Column({ name: 'shipping_method' })
  shippingMethod: string

  @Column({
    type: 'enum',
    enum: TrackingStatus,
    default: TrackingStatus.LABEL_CREATED,
  })
  status: TrackingStatus

  @Column({ name: 'estimated_delivery_date', type: 'timestamp', nullable: true })
  estimatedDeliveryDate?: Date

  @Column({ name: 'shipped_at', type: 'timestamp' })
  shippedAt: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: {
    length: number
    width: number
    height: number
  }

  @Column({ name: 'last_location_update', nullable: true })
  lastLocationUpdate?: string

  @Column({ type: 'jsonb', nullable: true })
  trackingHistory?: Array<{
    status: TrackingStatus
    location: string
    timestamp: Date
    description: string
    nextAction?: string
  }>

  @Column({ type: 'text', nullable: true })
  notes?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
