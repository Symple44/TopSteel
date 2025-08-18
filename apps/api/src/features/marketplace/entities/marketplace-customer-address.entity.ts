import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MarketplaceCustomer } from './marketplace-customer.entity'

@Entity('marketplace_customer_addresses')
@Index(['customerId'])
export class MarketplaceCustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string

  @ManyToOne(
    () => MarketplaceCustomer,
    (customer) => customer.addresses,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'customer_id' })
  customer: MarketplaceCustomer

  @Column({ type: 'varchar', length: 100, nullable: true })
  label?: string

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  company?: string

  @Column({ type: 'text' })
  street: string

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'street_2' })
  street2?: string

  @Column({ type: 'varchar', length: 100 })
  city: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string

  @Column({ type: 'varchar', length: 20, name: 'postal_code' })
  postalCode: string

  @Column({ type: 'varchar', length: 2, default: 'FR' })
  country: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string

  @Column({ type: 'boolean', default: false, name: 'is_default_shipping' })
  isDefaultShipping: boolean

  @Column({ type: 'boolean', default: false, name: 'is_default_billing' })
  isDefaultBilling: boolean

  @Column({ type: 'text', nullable: true, name: 'additional_info' })
  additionalInfo?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
