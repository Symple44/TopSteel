import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('marketplace_shop_configurations')
export class MarketplaceShopConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', length: 50, unique: true })
  tenantId: string

  // General settings
  @Column({ name: 'shop_name', length: 255 })
  shopName: string

  @Column({ name: 'shop_description', type: 'text', nullable: true })
  shopDescription: string

  @Column({ name: 'shop_logo', nullable: true })
  shopLogo: string

  @Column({ name: 'shop_banner', nullable: true })
  shopBanner: string

  @Column({ name: 'contact_email' })
  contactEmail: string

  @Column({ name: 'support_email', nullable: true })
  supportEmail: string

  @Column({ nullable: true })
  phone: string

  // Business information
  @Column({ name: 'company_name', nullable: true })
  companyName: string

  @Column('jsonb', { name: 'company_address', nullable: true })
  companyAddress: {
    street: string
    city: string
    postalCode: string
    country: string
    region?: string
  }

  @Column({ name: 'vat_number', nullable: true })
  vatNumber: string

  @Column({ name: 'business_registration', nullable: true })
  businessRegistration: string

  // Appearance
  @Column('jsonb')
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    linkColor: string
    font?: string
    layout?: 'grid' | 'list' | 'mixed'
  }

  // Catalog settings
  @Column('jsonb')
  catalog: {
    defaultCurrency: string
    allowMultipleCurrencies: boolean
    supportedCurrencies: string[]
    showPricesWithTax: boolean
    taxRate: number
    categoryLayout: 'tree' | 'flat'
    productsPerPage: number
    allowProductReviews: boolean
    requireReviewApproval: boolean
    showStockLevels: boolean
    enableWishlist: boolean
    enableProductComparison: boolean
  }

  // Order settings
  @Column('jsonb', { name: 'order_settings' })
  orderSettings: {
    enableGuestCheckout: boolean
    requireAccountVerification: boolean
    defaultOrderStatus: string
    autoApproveOrders: boolean
    orderNumberPrefix: string
    orderNumberFormat: 'sequential' | 'random' | 'timestamp'
    allowOrderCancellation: boolean
    cancellationTimeLimit: number // hours
    enableOrderTracking: boolean
  }

  // Payment settings
  @Column('jsonb', { name: 'payment_settings' })
  paymentSettings: {
    enableStripe: boolean
    enablePaypal: boolean
    enableBankTransfer: boolean
    enableCashOnDelivery: boolean
    minimumOrderAmount: number
    paymentTimeout: number // minutes
    autoRefundCancelled: boolean
  }

  // Shipping settings
  @Column('jsonb', { name: 'shipping_settings' })
  shippingSettings: {
    freeShippingThreshold: number
    defaultShippingCost: number
    enableExpressShipping: boolean
    expressShippingCost: number
    enableInternationalShipping: boolean
    handlingTime: number // days
    shippingZones: Array<{
      name: string
      countries: string[]
      cost: number
      freeThreshold?: number
    }>
  }

  // Marketing settings
  @Column('jsonb')
  marketing: {
    enableNewsletterSignup: boolean
    enableProductRecommendations: boolean
    enableAbandonedCartRecovery: boolean
    enableCoupons: boolean
    enableLoyaltyProgram: boolean
    trackingPixels: Array<{
      name: string
      code: string
      enabled: boolean
    }>
  }

  // SEO settings
  @Column('jsonb')
  seo: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string[]
    ogImage?: string
    sitemapEnabled: boolean
    robotsPolicy: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow'
    structuredDataEnabled: boolean
  }

  // Legal settings
  @Column('jsonb')
  legal: {
    termsOfServiceUrl?: string
    privacyPolicyUrl?: string
    returnPolicyUrl?: string
    cookiePolicyUrl?: string
    gdprCompliant: boolean
    ageVerificationRequired: boolean
    minimumAge?: number
  }

  // Notifications
  @Column('jsonb')
  notifications: {
    emailNotifications: {
      orderConfirmation: boolean
      orderStatusUpdate: boolean
      paymentConfirmation: boolean
      shipmentUpdate: boolean
      stockAlerts: boolean
      lowStockThreshold: number
    }
    adminNotifications: {
      newOrders: boolean
      paymentFailures: boolean
      stockAlerts: boolean
      customerRegistrations: boolean
      reviewSubmissions: boolean
    }
  }

  // Advanced settings
  @Column('jsonb')
  advanced: {
    enableCache: boolean
    cacheTimeout: number // seconds
    enableCdn: boolean
    cdnUrl?: string
    enableCompression: boolean
    apiRateLimit: number // requests per minute
    sessionTimeout: number // minutes
    enableMaintenance: boolean
    maintenanceMessage?: string
  }

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
