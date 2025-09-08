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
import { Partner } from '../../../domains/partners/entities/partner.entity'
// Removed imports to avoid circular dependencies
// import { MarketplaceCustomerAddress } from './marketplace-customer-address.entity'
// import { MarketplaceOrder } from './marketplace-order.entity'

@Entity('marketplace_customers')
@Index(['email', 'tenantId'], { unique: true }) // Unique customer per tenant
@Index(['tenantId']) // Multi-tenant queries
@Index(['tenantId', 'isActive']) // Active customers per tenant
@Index(['customerGroup', 'loyaltyTier']) // Customer segmentation
@Index(['lastOrderDate']) // Customer activity analysis
@Index(['totalSpent']) // Customer value analysis
@Index(['createdAt']) // Customer acquisition tracking
@Index(['emailVerified', 'isActive']) // Verified active customers
export class MarketplaceCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 254 })
  @Index()
  email: string

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string

  @Column({ type: 'varchar', length: 50, name: 'first_name' })
  @Index() // Index for name-based searches
  firstName: string

  @Column({ type: 'varchar', length: 50, name: 'last_name' })
  @Index() // Index for name-based searches
  lastName: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index() // Index for active customer filtering
  isActive: boolean

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  @Index() // Index for email verification status
  emailVerified: boolean

  @Column({ type: 'boolean', default: false, name: 'accept_marketing' })
  acceptMarketing: boolean

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId: string

  @Column({ type: 'uuid', nullable: true, name: 'erp_partner_id' })
  @Index() // Index for ERP partner linking
  erpPartnerId?: string

  @ManyToOne(() => Partner, { nullable: true })
  @JoinColumn({ name: 'erp_partner_id' })
  erpPartner?: Partner

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for metadata queries
  metadata?: {
    registeredAt?: Date
    registrationIp?: string
    lastLoginAt?: Date
    lastLoginIp?: string
    verifiedAt?: Date
    passwordChangedAt?: Date
    locale?: string
    timezone?: string
    source?: string
    referrer?: string
    tags?: string[]
    stripeCustomerId?: string
  }

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for preferences queries
  preferences?: {
    language?: string
    currency?: string
    newsletter?: boolean
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
  }

  @OneToMany('MarketplaceOrder', 'customer', { lazy: true })
  orders?: unknown[]

  @OneToMany('MarketplaceCustomerAddress', 'customer', { lazy: true })
  addresses?: unknown[]

  @Column({ type: 'uuid', nullable: true, name: 'default_shipping_address_id' })
  defaultShippingAddressId?: string

  @Column({ type: 'uuid', nullable: true, name: 'default_billing_address_id' })
  defaultBillingAddressId?: string

  @Column({ type: 'integer', default: 0, name: 'total_orders' })
  totalOrders: number

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_spent' })
  totalSpent: number

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'customer_group' })
  @Index() // Index for customer segmentation
  customerGroup?: string

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'loyalty_tier' })
  @Index() // Index for loyalty program queries
  loyaltyTier?: string

  @Column({ type: 'integer', default: 0, name: 'loyalty_points' })
  loyaltyPoints: number

  @Column({ type: 'timestamp', nullable: true, name: 'last_order_date' })
  @Index() // Index for customer activity analysis
  lastOrderDate?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
