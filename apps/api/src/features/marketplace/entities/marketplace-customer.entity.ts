import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { MarketplaceOrder } from './marketplace-order.entity';
import { MarketplaceCustomerAddress } from './marketplace-customer-address.entity';
import { Partner } from '../../../domains/partners/entities/partner.entity';

@Entity('marketplace_customers')
@Index(['email', 'tenantId'], { unique: true })
@Index(['tenantId'])
export class MarketplaceCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 254 })
  @Index()
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 50, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'accept_marketing' })
  acceptMarketing: boolean;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true, name: 'erp_partner_id' })
  erpPartnerId?: string;

  @ManyToOne(() => Partner, { nullable: true })
  @JoinColumn({ name: 'erp_partner_id' })
  erpPartner?: Partner;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    registeredAt?: Date;
    registrationIp?: string;
    lastLoginAt?: Date;
    lastLoginIp?: string;
    verifiedAt?: Date;
    passwordChangedAt?: Date;
    locale?: string;
    timezone?: string;
    source?: string;
    referrer?: string;
    tags?: string[];
    stripeCustomerId?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    language?: string;
    currency?: string;
    newsletter?: boolean;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };

  @OneToMany(() => MarketplaceOrder, order => order.customer)
  orders?: MarketplaceOrder[];

  @OneToMany(() => MarketplaceCustomerAddress, address => address.customer)
  addresses?: MarketplaceCustomerAddress[];

  @Column({ type: 'uuid', nullable: true, name: 'default_shipping_address_id' })
  defaultShippingAddressId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'default_billing_address_id' })
  defaultBillingAddressId?: string;

  @Column({ type: 'integer', default: 0, name: 'total_orders' })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_spent' })
  totalSpent: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'customer_group' })
  customerGroup?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'loyalty_tier' })
  loyaltyTier?: string;

  @Column({ type: 'integer', default: 0, name: 'loyalty_points' })
  loyaltyPoints: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_order_date' })
  lastOrderDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}