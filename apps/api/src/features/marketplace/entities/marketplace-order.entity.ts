import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MarketplaceCustomer } from './marketplace-customer.entity'
import { MarketplaceOrderItem } from './marketplace-order-item.entity'

@Entity('marketplace_orders')
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'customer_id' })
  customerId: string

  @ManyToOne(() => MarketplaceCustomer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: MarketplaceCustomer

  @OneToMany(
    () => MarketplaceOrderItem,
    (item) => item.order,
    { cascade: true }
  )
  items: MarketplaceOrderItem[]

  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber: string

  @Column({ default: 'CART' })
  status: string

  @Column({ name: 'payment_status', default: 'PENDING' })
  paymentStatus: string

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string

  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId: string

  @Column({ name: 'payment_provider', nullable: true })
  paymentProvider: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number

  @Column({ name: 'applied_coupon_id', nullable: true })
  appliedCouponId: string

  @Column({ name: 'applied_coupon_code', nullable: true })
  appliedCouponCode: string

  @Column('jsonb', { name: 'applied_promotions', nullable: true })
  appliedPromotions: Array<{
    promotionId: string
    name: string
    type: string
    discount: number
  }>

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number

  @Column({ length: 3, default: 'EUR' })
  currency: string

  @Column('jsonb', { name: 'shipping_address', nullable: true })
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
    additionalInfo?: string
  }

  @Column('jsonb', { name: 'billing_address', nullable: true })
  billingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
    additionalInfo?: string
  }

  @Column('text', { nullable: true })
  notes: string

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>

  @Column('jsonb', { name: 'status_history', nullable: true })
  statusHistory: Array<{
    status: string
    timestamp: Date
    notes?: string
  }>

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date

  @Column({ name: 'moderation_status', default: 'PENDING' })
  moderationStatus: string

  @Column({ name: 'moderated_by', nullable: true })
  moderatedBy: string

  @Column({ name: 'moderated_at', type: 'timestamp', nullable: true })
  moderatedAt: Date

  @Column({ name: 'assigned_moderator', nullable: true })
  assignedModerator: string

  @Column('jsonb', { nullable: true })
  flags: Array<{
    type: string
    severity: string
    message: string
    createdAt: Date
    resolvedAt?: Date
    resolvedBy?: string
  }>

  @Column('jsonb', { name: 'moderation_notes', nullable: true })
  moderationNotes: Array<{
    id: string
    message: string
    createdBy: string
    createdAt: Date
    isInternal: boolean
  }>

  @Column({ default: 'LOW' })
  priority: string

  @Column({ name: 'disabled_reason', nullable: true })
  disabledReason: string

  @Column({ name: 'disabled_at', type: 'timestamp', nullable: true })
  disabledAt: Date

  @Column({ name: 'tenant_id', length: 50 })
  tenantId: string

  // Additional properties needed by the service
  @Column('jsonb', { name: 'payment_details', nullable: true })
  paymentDetails?: Record<string, any>

  @Column({ name: 'placed_at', type: 'timestamp', nullable: true })
  placedAt?: Date

  @Column('jsonb', { name: 'shipping_info', nullable: true })
  shippingInfo?: {
    carrier?: string
    trackingNumber?: string
    estimatedDelivery?: Date
    shippingMethod?: string
  }

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
