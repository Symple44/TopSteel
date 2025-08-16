import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('marketplace_coupons')
export class MarketplaceCoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', length: 50 })
  tenantId: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']
  })
  type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'max_usages', nullable: true })
  maxUsages: number;

  @Column({ name: 'max_usages_per_customer', nullable: true })
  maxUsagesPerCustomer: number;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'minimum_order_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumOrderAmount: number;

  @Column('simple-array', { name: 'applicable_products', nullable: true })
  applicableProducts: string[];

  @Column('simple-array', { name: 'applicable_categories', nullable: true })
  applicableCategories: string[];

  @Column('simple-array', { name: 'excluded_products', nullable: true })
  excludedProducts: string[];

  @Column('simple-array', { name: 'excluded_categories', nullable: true })
  excludedCategories: string[];

  @Column('simple-array', { name: 'customer_groups', nullable: true })
  customerGroups: string[];

  @Column('simple-array', { name: 'customer_emails', nullable: true })
  customerEmails: string[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}