export interface Address {
  name?: string
  company?: string
  street: string
  city: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

export interface OrderItem {
  id?: string
  productId: string
  name: string
  sku?: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
}

export interface OrderData {
  orderId: string
  orderNumber: string
  customerId?: string
  customerEmail?: string
  customerName?: string
  totalAmount: number
  subtotal: number
  tax?: number
  shipping?: number
  discount?: number
  currency: string
  items: OrderItem[]
  shippingAddress?: Address
  billingAddress?: Address
  notes?: string
  metadata?: Record<string, unknown>
}

export interface PostgreSQLError extends Error {
  code?: string
  detail?: string
  hint?: string
  position?: string
  internalPosition?: string
  internalQuery?: string
  where?: string
  schema?: string
  table?: string
  column?: string
  dataType?: string
  constraint?: string
  file?: string
  line?: string
  routine?: string
}

export interface MarketplaceConfiguration {
  enabled?: boolean
  contactEmail?: string
  supportEmail?: string
  theme?: string
  logo?: string
  favicon?: string
  features?: string[]
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  analytics?: {
    googleAnalyticsId?: string
    facebookPixelId?: string
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  FAILED = 'FAILED'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}