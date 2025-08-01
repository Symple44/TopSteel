import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm'
import { MarketplaceCustomer } from '../../customers/entities/marketplace-customer.entity'
import { MarketplaceOrderItem } from './marketplace-order-item.entity'

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  address: string
  addressComplement?: string
  zipCode: string
  city: string
  country: string
  phone?: string
}

export interface BillingAddress extends ShippingAddress {}

@Entity('marketplace_orders')
@Index(['societeId', 'orderNumber'], { unique: true })
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customerId?: string

  @Column({ type: 'uuid', nullable: true })
  erpOrderId?: string // Référence vers commande ERP

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  orderNumber!: string

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  @Index()
  status!: OrderStatus

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Index()
  paymentStatus!: PaymentStatus

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerPhone?: string

  @Column({ type: 'jsonb' })
  shippingAddress!: ShippingAddress

  @Column({ type: 'jsonb' })
  billingAddress!: BillingAddress

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  subtotalHT!: number

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  shippingCostHT!: number

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  discountAmount!: number

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalTVA!: number

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalTTC!: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingMethod?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod?: string

  @Column({ type: 'text', nullable: true })
  customerNotes?: string

  @Column({ type: 'text', nullable: true })
  internalNotes?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  trackingNumber?: string

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date

  @Column({ type: 'jsonb', nullable: true })
  paymentData?: {
    transactionId?: string
    paymentProvider?: string
    paymentMethodDetails?: Record<string, any>
    refunds?: Array<{
      id: string
      amount: number
      reason: string
      date: string
    }>
  }

  @Column({ type: 'jsonb', default: {} })
  metadata?: {
    source?: 'marketplace' | 'erp'
    userAgent?: string
    ipAddress?: string
    promotionCodes?: string[]
    tags?: string[]
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne(() => MarketplaceCustomer, customer => customer.orders, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: MarketplaceCustomer

  @OneToMany(() => MarketplaceOrderItem, item => item.order, { cascade: true })
  items!: MarketplaceOrderItem[]

  // Méthodes utilitaires
  isGuest(): boolean {
    return !this.customerId
  }

  getCustomerName(): string {
    if (this.customer) {
      return this.customer.getDisplayName()
    }
    return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`
  }

  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status)
  }

  canBeShipped(): boolean {
    return this.status === OrderStatus.PROCESSING && this.paymentStatus === PaymentStatus.PAID
  }

  canBeRefunded(): boolean {
    return this.paymentStatus === PaymentStatus.PAID && 
           [OrderStatus.DELIVERED, OrderStatus.SHIPPED].includes(this.status)
  }

  getTotalItems(): number {
    return this.items?.reduce((total, item) => total + item.quantity, 0) || 0
  }

  hasDigitalItems(): boolean {
    return this.items?.some(item => item.isDigital) || false
  }

  needsShipping(): boolean {
    return !this.hasDigitalItems() || this.items?.some(item => !item.isDigital) || false
  }

  updateStatus(newStatus: OrderStatus): void {
    this.status = newStatus
    
    if (newStatus === OrderStatus.SHIPPED && !this.shippedAt) {
      this.shippedAt = new Date()
    } else if (newStatus === OrderStatus.DELIVERED && !this.deliveredAt) {
      this.deliveredAt = new Date()
    }
  }

  calculateTotals(): void {
    this.subtotalHT = this.items?.reduce((total, item) => total + item.totalHT, 0) || 0
    this.totalTVA = this.items?.reduce((total, item) => total + item.totalTVA, 0) || 0
    this.totalTTC = this.subtotalHT + this.totalTVA + this.shippingCostHT - this.discountAmount
  }
}