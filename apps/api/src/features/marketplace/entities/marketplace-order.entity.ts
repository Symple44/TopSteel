import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { SafeObject } from '../../../../../../packages/ui/src/types/common'
// Removed imports to avoid circular dependencies
import type { MarketplaceCustomer } from './marketplace-customer.entity'
import type { MarketplaceOrderItem } from './marketplace-order-item.entity'

@Entity('marketplace_orders')
@Index(['customerId', 'status']) // For customer order filtering
@Index(['status', 'createdAt']) // For order status timeline
@Index(['orderNumber'], { unique: true }) // Unique constraint on order number
@Index(['paymentStatus', 'paidAt']) // For payment tracking
@Index(['moderationStatus', 'assignedModerator']) // For moderation workflow
@Index(['tenantId', 'status', 'createdAt']) // For multi-tenant queries
@Index(['customerId', 'createdAt']) // For customer order history
@Index(['shippedAt']) // For shipping tracking
@Index(['deliveredAt']) // For delivery tracking
@Index(['priority']) // For priority-based ordering
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'customer_id' })
  @Index() // Index for customer lookups
  customerId: string

  @ManyToOne('MarketplaceCustomer', 'orders', { onDelete: 'RESTRICT', lazy: true })
  @JoinColumn({ name: 'customer_id' })
  customer: MarketplaceCustomer

  @OneToMany('MarketplaceOrderItem', 'order', { cascade: true, lazy: true })
  items: MarketplaceOrderItem[]

  @Column({ name: 'order_number', length: 50, unique: true })
  @Index({ unique: true }) // Unique index for order number lookups
  orderNumber: string

  @Column({ default: 'CART' })
  @Index() // Index for order status filtering
  status: string

  @Column({ name: 'payment_status', default: 'PENDING' })
  @Index() // Index for payment status filtering
  paymentStatus: string

  @Column({ name: 'payment_method', nullable: true })
  @Index() // Index for payment method analytics
  paymentMethod: string

  @Column({ name: 'payment_intent_id', nullable: true })
  @Index({ where: 'paymentIntentId IS NOT NULL' }) // Partial index for payment processing
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
  @Index() // Index for coupon usage analytics
  appliedCouponCode: string

  @Column('jsonb', { name: 'applied_promotions', nullable: true })
  @Index() // GIN index for promotion queries
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
  @Index() // GIN index for metadata queries
  metadata: SafeObject

  @Column('jsonb', { name: 'status_history', nullable: true })
  @Index() // GIN index for status history queries
  statusHistory: Array<{
    status: string
    timestamp: Date
    notes?: string
  }>

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  @Index() // Index for payment tracking
  paidAt: Date

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  @Index() // Index for shipping tracking
  shippedAt: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  @Index() // Index for delivery tracking
  deliveredAt: Date

  @Column({ name: 'moderation_status', default: 'PENDING' })
  @Index() // Index for moderation workflow
  moderationStatus: string

  @Column({ name: 'moderated_by', nullable: true })
  moderatedBy: string

  @Column({ name: 'moderated_at', type: 'timestamp', nullable: true })
  moderatedAt: Date

  @Column({ name: 'assigned_moderator', nullable: true })
  @Index() // Index for moderator assignment
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
  @Index() // Index for priority-based ordering
  priority: string

  @Column({ name: 'disabled_reason', nullable: true })
  disabledReason: string

  @Column({ name: 'disabled_at', type: 'timestamp', nullable: true })
  disabledAt: Date

  @Column({ name: 'tenant_id', length: 50 })
  @Index() // Index for multi-tenant queries
  tenantId: string

  // Additional properties needed by the service
  @Column('jsonb', { name: 'payment_details', nullable: true })
  paymentDetails?: SafeObject

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
