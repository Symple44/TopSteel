import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum SocieteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

@Entity('societes')
export class Societe {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  siret?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  adresse?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  codePostal?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  pays?: string

  @Column({
    type: 'enum',
    enum: SocieteStatus,
    default: SocieteStatus.TRIAL,
  })
  status!: SocieteStatus

  @Column({ type: 'varchar', length: 100 })
  databaseName!: string

  @Column({ type: 'jsonb', default: {} })
  configuration!: {
    modules?: string[]
    features?: string[]
    marketplace?: {
      enabled?: boolean
      domain?: string
      requiresAuth?: boolean
      allowGuestCheckout?: boolean
      paymentMethods?: string[]
      logo?: string
      favicon?: string
      phone?: string
      showPrices?: boolean
      showStock?: boolean
      enableWishlist?: boolean
      enableCompare?: boolean
      enableReviews?: boolean
      social?: {
        facebook?: string
        twitter?: string
        instagram?: string
        linkedin?: string
      }
    }
    theme?: Record<string, any>
    locale?: string
    timezone?: string
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}