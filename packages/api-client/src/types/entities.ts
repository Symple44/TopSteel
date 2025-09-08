/**
 * Entity-specific type definitions
 * Replaces 'any' types with domain-specific interfaces
 */

import type { BaseEntity, JsonValue, SafeObject } from './common'

// User and authentication types
export interface User extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  roles?: Role[]
  groups?: Group[]
  preferences?: UserPreferences
  lastLoginAt?: Date
}

export interface Role extends BaseEntity {
  name: string
  description?: string
  permissions?: Permission[]
  isSystem: boolean
}

export interface Permission extends BaseEntity {
  name: string
  resource: string
  action: string
  description?: string
}

export interface Group extends BaseEntity {
  name: string
  description?: string
  users?: User[]
  permissions?: Permission[]
}

export type UserPreferences = SafeObject & {
  theme?: 'light' | 'dark'
  language?: string
  timezone?: string
  notifications?: NotificationPreferences
  menuPreferences?: MenuPreferences
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  categories: SafeObject
}

export type MenuPreferences = SafeObject & {
  collapsed?: boolean
  favorites?: string[]
  customOrder?: string[]
}

// Menu and navigation types
export interface MenuItem extends BaseEntity {
  title: string
  path: string
  icon?: string
  order: number
  parentId?: string
  isActive: boolean
  permissions?: string[]
  children?: MenuItem[]
  metadata?: SafeObject
}

export interface MenuConfiguration extends BaseEntity {
  name: string
  items: MenuItem[]
  isDefault: boolean
  roles?: string[]
  metadata?: SafeObject
}

// Partner and customer types
export interface Partner extends BaseEntity {
  name: string
  type: 'customer' | 'supplier' | 'both'
  email?: string
  phone?: string
  taxNumber?: string
  addresses?: PartnerAddress[]
  contacts?: Contact[]
  sites?: PartnerSite[]
  isActive: boolean
  metadata?: SafeObject
}

export interface PartnerAddress extends BaseEntity {
  partnerId: string
  type: 'billing' | 'shipping' | 'main'
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
  isDefault: boolean
}

export interface Contact extends BaseEntity {
  partnerId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position?: string
  isPrimary: boolean
  metadata?: SafeObject
}

export interface PartnerSite extends BaseEntity {
  partnerId: string
  name: string
  addressId: string
  isActive: boolean
  metadata?: SafeObject
}

// Material and inventory types
export interface Material extends BaseEntity {
  code: string
  name: string
  description?: string
  category?: string
  unit: string
  specifications?: MaterialSpecifications
  pricing?: MaterialPricing
  inventory?: InventoryInfo
  isActive: boolean
  metadata?: SafeObject
}

export type MaterialSpecifications = SafeObject & {
  dimensions?: {
    length?: number
    width?: number
    height?: number
    weight?: number
  }
  properties?: SafeObject
  certifications?: string[]
}

export type MaterialPricing = SafeObject & {
  basePricePerUnit: number
  currency: string
  priceRules?: PriceRule[]
  discounts?: DiscountRule[]
}

export type PriceRule = SafeObject & {
  minQuantity: number
  pricePerUnit: number
  validFrom?: Date
  validTo?: Date
}

export type DiscountRule = SafeObject & {
  type: 'percentage' | 'fixed'
  value: number
  conditions?: SafeObject
}

export type InventoryInfo = SafeObject & {
  currentStock: number
  reservedStock: number
  availableStock: number
  reorderPoint: number
  maxStock: number
  location?: string
}

// Order and transaction types
export interface Order extends BaseEntity {
  orderNumber: string
  customerId: string
  status: OrderStatus
  items: OrderItem[]
  totals: OrderTotals
  addresses: OrderAddresses
  payment?: PaymentInfo
  shipping?: ShippingInfo
  metadata?: SafeObject
}

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem extends BaseEntity {
  orderId: string
  materialId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specifications?: SafeObject
  metadata?: SafeObject
}

export interface OrderTotals {
  subtotal: number
  taxes: number
  shipping: number
  discounts: number
  total: number
  currency: string
}

export interface OrderAddresses {
  billing: AddressInfo
  shipping?: AddressInfo
}

export interface AddressInfo {
  firstName: string
  lastName: string
  company?: string
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
  phone?: string
}

export type PaymentInfo = SafeObject & {
  method: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  amount: number
  currency: string
  transactionId?: string
  processedAt?: Date
}

export type ShippingInfo = SafeObject & {
  method: string
  carrier: string
  trackingNumber?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
}

// Notification and communication types
export interface NotificationRule extends BaseEntity {
  name: string
  description?: string
  event: string
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  isActive: boolean
  metadata?: SafeObject
}

export type NotificationCondition = SafeObject & {
  field: string
  operator: string
  value: JsonValue
  logicalOperator?: 'AND' | 'OR'
}

export type NotificationAction = SafeObject & {
  type: 'email' | 'sms' | 'webhook' | 'push'
  config: SafeObject
  template?: string
}

export interface NotificationExecution extends BaseEntity {
  ruleId: string
  event: string
  status: 'success' | 'failed' | 'pending'
  recipients: string[]
  payload: SafeObject
  error?: string
  executedAt: Date
}

// Licensing and subscription types
export interface License extends BaseEntity {
  key: string
  type: string
  status: 'active' | 'expired' | 'suspended' | 'revoked'
  features: LicenseFeature[]
  usage?: LicenseUsage
  validFrom: Date
  validTo?: Date
  metadata?: SafeObject
}

export interface LicenseFeature extends BaseEntity {
  licenseId: string
  feature: string
  limit?: number
  isEnabled: boolean
  config?: SafeObject
}

export interface LicenseUsage extends BaseEntity {
  licenseId: string
  feature: string
  usageCount: number
  lastUsedAt: Date
  resetDate?: Date
}

export interface LicenseActivation extends BaseEntity {
  licenseId: string
  userId: string
  deviceInfo?: SafeObject
  ipAddress: string
  userAgent: string
  activatedAt: Date
  lastSeenAt: Date
}

// Query builder types
export interface QueryBuilder extends BaseEntity {
  name: string
  description?: string
  query: QueryDefinition
  permissions: QueryPermission[]
  isPublic: boolean
  createdBy: string
  metadata?: SafeObject
}

export type QueryDefinition = SafeObject & {
  tables: string[]
  columns: QueryColumn[]
  joins: QueryJoin[]
  filters: QueryFilter[]
  groupBy?: string[]
  orderBy?: QuerySort[]
  limit?: number
}

export type QueryColumn = SafeObject & {
  table: string
  column: string
  alias?: string
  function?: string
}

export type QueryJoin = SafeObject & {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  alias?: string
  condition: string
}

export type QueryFilter = SafeObject & {
  column: string
  operator: string
  value: JsonValue
  logicalOperator?: 'AND' | 'OR'
}

export type QuerySort = SafeObject & {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface QueryPermission extends BaseEntity {
  queryId: string
  userId?: string
  roleId?: string
  permission: 'read' | 'write' | 'execute' | 'admin'
}

// Stock movement types
export interface StockMovement extends BaseEntity {
  materialId: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  unit: string
  reference?: string
  reason?: string
  fromLocation?: string
  toLocation?: string
  userId: string
  metadata?: SafeObject
}

// Audit log types
export interface AuditLog extends BaseEntity {
  action: string
  resource: string
  resourceId: string
  userId: string
  oldValues?: SafeObject
  newValues?: SafeObject
  metadata?: SafeObject
}
