import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export enum MarketplaceCategory {
  HR = 'HR',                    // Ressources Humaines
  PROCUREMENT = 'PROCUREMENT',   // Achats/Approvisionnement
  ANALYTICS = 'ANALYTICS',       // Analytique/BI
  INTEGRATION = 'INTEGRATION',   // Intégrations externes
  QUALITY = 'QUALITY',          // Qualité
  MAINTENANCE = 'MAINTENANCE',   // Maintenance prédictive
  FINANCE = 'FINANCE'           // Finance avancée
}

export enum ModuleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  DISABLED = 'DISABLED'
}

export enum PricingType {
  FREE = 'FREE',
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION',
  COMMISSION = 'COMMISSION',
  USAGE_BASED = 'USAGE_BASED'
}

export interface ModulePricing {
  type: PricingType
  amount?: number
  currency?: string
  period?: 'MONTH' | 'YEAR'
  setupFee?: number
  commissionRate?: number
  usageUnit?: string
  description?: string
}

export interface PermissionDefinition {
  moduleId: string
  action: string
  name: string
  description: string
}

export interface MenuItemDto {
  id?: string
  parentId?: string
  title: string
  titleKey?: string
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  orderIndex: number
  isVisible: boolean
  moduleId?: string
  target?: string
  type: string
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  permissions?: string[]
  roles?: string[]
  children?: MenuItemDto[]
}

export interface ApiRouteDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: string
  permissions?: string[]
}

export interface ModuleMetadata {
  author: string
  homepage?: string
  repository?: string
  keywords: string[]
  screenshots?: string[]
  documentation?: string
  changelog?: string
  supportContact?: string
}

@Entity('marketplace_modules')
@Index(['moduleKey'], { unique: true })
export class MarketplaceModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true, name: 'module_key' })
  moduleKey!: string

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'enum', enum: MarketplaceCategory })
  @Index()
  category!: MarketplaceCategory

  @Column({ type: 'varchar', length: 50 })
  version!: string

  @Column({ type: 'varchar', length: 100 })
  publisher!: string

  @Column({ type: 'enum', enum: ModuleStatus, default: ModuleStatus.DRAFT })
  @Index()
  status!: ModuleStatus

  @Column({ type: 'json' })
  pricing!: ModulePricing

  @Column({ type: 'json', nullable: true })
  dependencies?: string[]

  @Column({ type: 'json', nullable: true, name: 'menu_configuration' })
  menuConfiguration?: MenuItemDto[]

  @Column({ type: 'json', nullable: true })
  permissions?: PermissionDefinition[]

  @Column({ type: 'json', nullable: true, name: 'api_routes' })
  apiRoutes?: ApiRouteDefinition[]

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string

  @Column({ type: 'text', nullable: true, name: 'short_description' })
  shortDescription?: string

  @Column({ type: 'json', nullable: true })
  metadata?: ModuleMetadata

  @Column({ type: 'integer', default: 0, name: 'download_count' })
  downloadCount!: number

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'rating_average' })
  ratingAverage!: number

  @Column({ type: 'integer', default: 0, name: 'rating_count' })
  ratingCount!: number

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy?: string

  // Note: Relations cross-database supprimées pour l'architecture multitenant
  // Les installations sont dans la base tenant, gérées manuellement

  // Méthodes utilitaires
  static create(
    moduleKey: string,
    displayName: string,
    description: string,
    category: MarketplaceCategory,
    publisher: string,
    pricing: ModulePricing,
    createdBy: string
  ): MarketplaceModule {
    const module = new MarketplaceModule()
    module.moduleKey = moduleKey
    module.displayName = displayName
    module.description = description
    module.category = category
    module.publisher = publisher
    module.pricing = pricing
    module.version = '1.0.0'
    module.status = ModuleStatus.DRAFT
    module.isActive = true
    module.downloadCount = 0
    module.ratingAverage = 0
    module.ratingCount = 0
    module.createdBy = createdBy
    return module
  }

  isPublished(): boolean {
    return this.status === ModuleStatus.PUBLISHED && this.isActive
  }

  canBeInstalled(): boolean {
    return this.isPublished()
  }

  isFree(): boolean {
    return this.pricing.type === PricingType.FREE
  }

  hasSubscription(): boolean {
    return this.pricing.type === PricingType.SUBSCRIPTION
  }

  getMonthlyPrice(): number {
    if (this.pricing.type === PricingType.SUBSCRIPTION && this.pricing.period === 'MONTH') {
      return this.pricing.amount || 0
    }
    if (this.pricing.type === PricingType.SUBSCRIPTION && this.pricing.period === 'YEAR') {
      return (this.pricing.amount || 0) / 12
    }
    return 0
  }

  incrementDownloadCount(): void {
    this.downloadCount++
  }

  updateRating(newRating: number): void {
    const totalScore = this.ratingAverage * this.ratingCount + newRating
    this.ratingCount++
    this.ratingAverage = Number((totalScore / this.ratingCount).toFixed(2))
  }

  getFormattedPrice(): string {
    const currency = this.pricing.currency || 'EUR'
    
    switch (this.pricing.type) {
      case PricingType.FREE:
        return 'Gratuit'
      case PricingType.ONE_TIME:
        return `${this.pricing.amount}${currency} (unique)`
      case PricingType.SUBSCRIPTION:
        const period = this.pricing.period === 'YEAR' ? 'an' : 'mois'
        return `${this.pricing.amount}${currency}/${period}`
      case PricingType.COMMISSION:
        return `${(this.pricing.commissionRate || 0) * 100}% de commission`
      case PricingType.USAGE_BASED:
        return `Basé sur l'usage (${this.pricing.usageUnit})`
      default:
        return 'Prix sur demande'
    }
  }
}