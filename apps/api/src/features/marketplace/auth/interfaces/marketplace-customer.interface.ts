/**
 * Interface for authenticated marketplace customer from JWT token
 * This represents the customer data extracted from the JWT payload
 */
export interface MarketplaceCustomer {
  /** Customer ID (UUID) */
  id: string

  /** Alternative ID field that may be present in JWT (typically customer ID) */
  sub?: string

  /** Customer email address */
  email: string

  /** Customer first name */
  firstName: string

  /** Customer last name */
  lastName: string

  /** Whether the customer's email is verified */
  emailVerified: boolean

  /** Whether the customer account is active */
  isActive: boolean

  /** Tenant ID this customer belongs to */
  tenantId: string

  /** Customer's phone number (optional) */
  phone?: string

  /** When the customer account was created */
  createdAt: Date

  /** When the customer account was last updated */
  updatedAt: Date

  /** Customer group for segmentation (optional) */
  customerGroup?: string

  /** Customer loyalty tier (optional) */
  loyaltyTier?: string

  /** Customer loyalty points */
  loyaltyPoints: number

  /** Total number of orders placed */
  totalOrders: number

  /** Total amount spent by customer */
  totalSpent: number

  /** Date of last order (optional) */
  lastOrderDate?: Date

  /** ERP Partner ID if linked to ERP system (optional) */
  erpPartnerId?: string

  /** Customer metadata (optional) */
  metadata?: {
    registeredAt?: Date
    registrationIp?: string
    lastLoginAt?: Date
    lastLoginIp?: string
    verifiedAt?: Date
    passwordChangedAt?: Date
    locale?: string
    timezone?: string
    source?: string
    referrer?: string
    tags?: string[]
    stripeCustomerId?: string
  }

  /** Customer preferences (optional) */
  preferences?: {
    language?: string
    currency?: string
    newsletter?: boolean
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
  }
}

/**
 * Simplified interface for JWT token payload
 * This is what actually gets stored in the JWT token
 */
export interface MarketplaceCustomerJwtPayload {
  /** Customer ID (typically stored as 'sub' in JWT) */
  sub: string

  /** Customer ID (alternative field) */
  id: string

  /** Customer email address */
  email: string

  /** Customer first name */
  firstName: string

  /** Customer last name */
  lastName: string

  /** Tenant ID this customer belongs to */
  tenantId: string

  /** Whether the customer's email is verified */
  emailVerified: boolean

  /** Whether the customer account is active */
  isActive: boolean

  /** JWT issued at timestamp */
  iat?: number

  /** JWT expiration timestamp */
  exp?: number
}

/**
 * Interface for customer session data stored in Redis
 */
export interface MarketplaceCustomerSession {
  /** Session ID */
  id: string

  /** When the session was created */
  createdAt: Date

  /** When the session was last accessed */
  lastAccessedAt: Date

  /** IP address of the session */
  ipAddress: string

  /** User agent of the session */
  userAgent?: string

  /** Device type */
  deviceType?: string

  /** Location information */
  location?: {
    country?: string
    city?: string
    region?: string
  }

  /** Whether this is the current session */
  isCurrentSession: boolean

  /** Session metadata */
  metadata?: {
    loginMethod?: string
    remember?: boolean
  }
}
