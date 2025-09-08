/**
 * Types pour le Marketplace
 * Créé pour résoudre les erreurs TypeScript dans les services marketplace
 */

// Types pour Cloudflare CDN
export interface CloudflareConfig {
  accountId: string
  apiToken: string
  zoneId?: string
  baseUrl?: string
  imagesApiToken: string
  imagesAccountHash: string
  customDomain?: string
}

export interface CloudflareImageUploadResponse {
  id: string
  filename: string
  uploaded: string
  requireSignedURLs: boolean
  variants: string[]
  success: boolean
  errors?: Array<{ code: number; message: string }>
  messages?: string[]
}

export interface CloudflareZone {
  id: string
  name: string
  status: string
  type: string
  development_mode: number
  name_servers: string[]
  original_name_servers: string[]
}

// Types pour Stripe Payment
export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: StripePaymentStatus
  client_secret: string
  payment_method?: string
  customer?: string
  metadata?: Record<string, string>
  created: number
}

export type StripePaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  phone?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  metadata?: Record<string, string>
}

export interface StripeCheckoutSession {
  id: string
  payment_intent: string
  customer?: string
  customer_email?: string
  line_items?: {
    data: Array<{
      id: string
      quantity: number
      price: {
        id: string
        unit_amount: number
        currency: string
      }
    }>
  }
  metadata?: Record<string, string>
  success_url: string
  cancel_url: string
}

// Types pour les commandes Marketplace
export interface MarketplaceOrder {
  id: string
  orderNumber: string
  customerId: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  paymentMethod?: string
  paymentStatus: PaymentStatus
  shippingAddress?: Address
  billingAddress?: Address
  metadata?: Record<string, unknown>
  createdAt: Date | string
  updatedAt: Date | string
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  sku?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
  tax?: number
  metadata?: Record<string, unknown>
}

export interface Address {
  name: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

// Types pour les promotions
export interface MarketplacePromotion {
  id: string
  code: string
  name: string
  description?: string
  type: PromotionType
  value: number // Pourcentage ou montant fixe
  conditions?: PromotionCondition[]
  startDate: Date | string
  endDate: Date | string
  usageLimit?: number
  usageCount: number
  isActive: boolean
  metadata?: Record<string, unknown>
  createdAt: Date | string
  updatedAt: Date | string
}

export type PromotionType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING'

export interface PromotionCondition {
  type: 'MIN_AMOUNT' | 'MIN_QUANTITY' | 'PRODUCT' | 'CATEGORY' | 'CUSTOMER'
  value: unknown
  operator?: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN'
}

// Types pour les modules marketplace
export interface MarketplaceModule {
  id: string
  name: string
  version: string
  description?: string
  author: string
  category: ModuleCategory
  status: ModuleStatus
  price?: number
  screenshots?: string[]
  documentation?: string
  dependencies?: string[]
  permissions?: string[]
  config?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: Date | string
  updatedAt: Date | string
}

export type ModuleCategory =
  | 'ACCOUNTING'
  | 'CRM'
  | 'INVENTORY'
  | 'PRODUCTION'
  | 'REPORTING'
  | 'INTEGRATION'
  | 'UTILITY'

export type ModuleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'DEPRECATED'

// Types pour Sentry monitoring
export interface SentryConfig {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  profilesSampleRate?: number
  integrations?: string[]
  beforeSend?: (event: unknown) => unknown
}

export interface SentryContext {
  user?: {
    id: string
    email?: string
    username?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  fingerprint?: string[]
}