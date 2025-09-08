import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Removed direct import to avoid circular dependency
// import { MarketplacePriceRule } from './marketplace-price-rule.entity'

export interface SEOData {
  title?: string
  description?: string
  keywords?: string[]
  slug?: string
}

export interface ProductImages {
  url: string
  alt?: string
  isMain: boolean
  order: number
}

@Entity('marketplace_products')
@Index(['societeId', 'erpArticleId'], { unique: true })
export class MarketplaceProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'uuid' })
  erpArticleId!: string // Référence vers Article ERP

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: true })
  @Index()
  isVisible!: boolean

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  basePrice!: number

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number

  @Column({ type: 'jsonb', default: {} })
  marketplaceData!: {
    images?: ProductImages[]
    description?: string
    shortDescription?: string
    specifications?: Record<string, unknown>
    seo?: SEOData
    categories?: string[]
    tags?: string[]
    variants?: Array<{
      name: string
      values: string[]
    }>
    customFields?: Record<string, unknown>
  }

  @Column({ type: 'jsonb', default: {} })
  visibility!: {
    showPrice?: boolean
    showStock?: boolean
    allowBackorder?: boolean
    minQuantity?: number
    maxQuantity?: number
    customerGroups?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  analytics!: {
    views?: number
    lastViewed?: string
    orders?: number
    revenue?: number
    conversionRate?: number
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date

  // Relations
  @OneToMany('MarketplacePriceRule', 'product', { lazy: true })
  priceRules!: any[]

  // Méthodes utilitaires
  getMainImage(): ProductImages | undefined {
    return (
      this.marketplaceData.images?.find((img) => img.isMain) || this.marketplaceData.images?.[0]
    )
  }

  getAllImages(): ProductImages[] {
    return (
      this.marketplaceData.images?.sort((a, b) => {
        if (a.isMain) return -1
        if (b.isMain) return 1
        return a.order - b.order
      }) || []
    )
  }

  getSeoTitle(): string {
    return this.marketplaceData.seo?.title || ''
  }

  getSeoDescription(): string {
    return this.marketplaceData.seo?.description || this.marketplaceData.shortDescription || ''
  }

  getSlug(): string {
    return (
      this.marketplaceData.seo?.slug || this.erpArticleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    )
  }

  isInCategory(category: string): boolean {
    return this.marketplaceData.categories?.includes(category) || false
  }

  hasTag(tag: string): boolean {
    return this.marketplaceData.tags?.includes(tag) || false
  }

  incrementViews(): void {
    if (!this.analytics.views) this.analytics.views = 0
    this.analytics.views++
    this.analytics.lastViewed = new Date().toISOString()
  }

  getConversionRate(): number {
    if (!this.analytics.views || !this.analytics.orders) return 0
    return (this.analytics.orders / this.analytics.views) * 100
  }
}
