import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  OneToMany
} from 'typeorm'
import { MarketplaceOrder } from '../../orders/entities/marketplace-order.entity'

export interface CustomerAddress {
  id: string
  type: 'billing' | 'shipping'
  isDefault: boolean
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

export interface CustomerPreferences {
  language: string
  currency: string
  newsletter: boolean
  notifications: {
    orderUpdates: boolean
    promotions: boolean
    newProducts: boolean
  }
}

@Entity('marketplace_customers')
@Index(['societeId', 'email'], { unique: true })
export class MarketplaceCustomer {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  erpCustomerId?: string // Référence vers client ERP

  @Column({ type: 'varchar', length: 255 })
  email!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  company?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string

  @Column({ type: 'boolean', default: false })
  hasAccount!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken?: string

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date

  @Column({ type: 'jsonb', default: [] })
  addresses!: CustomerAddress[]

  @Column({ type: 'jsonb', default: {} })
  preferences!: CustomerPreferences

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    source: 'marketplace' | 'erp'
    lastLogin?: string
    loginCount?: number
    notes?: string
    tags?: string[]
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date

  // Relations
  @OneToMany(() => MarketplaceOrder, order => order.customer)
  orders!: MarketplaceOrder[]

  // Méthodes utilitaires
  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`
    }
    return this.firstName || this.lastName || this.email
  }

  getDisplayName(): string {
    return this.company || this.getFullName()
  }

  getDefaultAddress(type: 'billing' | 'shipping'): CustomerAddress | undefined {
    return this.addresses.find(addr => addr.type === type && addr.isDefault) ||
           this.addresses.find(addr => addr.type === type)
  }

  hasAddress(type: 'billing' | 'shipping'): boolean {
    return this.addresses.some(addr => addr.type === type)
  }

  isGuest(): boolean {
    return !this.hasAccount
  }

  canLogin(): boolean {
    return this.hasAccount && this.isActive && this.emailVerified && !!this.passwordHash
  }
}