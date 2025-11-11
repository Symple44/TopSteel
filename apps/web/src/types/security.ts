/**
 * Security and Authorization Types for TopSteel Application
 *
 * This file contains all security-related type definitions to ensure
 * type safety across the authentication and authorization system.
 *
 * NO 'any' types are used here to maintain security.
 */

// Temporary types until use-permissions is fixed
export interface AccessLevel {
  level: number
  name: string
}

export interface Permission {
  id: string
  name: string
  code: string
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
}

// import type { AccessLevel, Permission, Role } from '../hooks/use-permissions'
import type { AuthTokens, Company, User } from './auth'

// Enhanced Security Context Types
export interface SecurityContext {
  user: User | null
  company: Company | null
  permissions: Permission[]
  roles: Role[]
  accessLevels: Record<string, AccessLevel>
  sessionId: string
  isAuthenticated: boolean
  isAuthorized: (permission: Permission) => boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  canAccessResource: (resourceId: string, action: string) => boolean
}

// Role Assignment with Temporal Constraints
export interface RoleAssignment {
  id: string
  userId: string
  roleId: string
  companyId: string
  assignedBy: string
  assignedAt: Date
  expiresAt?: Date
  isActive: boolean
  conditions?: Record<string, unknown>
  metadata?: {
    source: 'manual' | 'automated' | 'inherited'
    reason?: string
    approvedBy?: string
  }
}

// Permission Assignment with Context
export interface PermissionAssignment {
  id: string
  userId: string
  permissionId: string
  resourceId?: string
  resourceType?: string
  companyId: string
  grantedBy: string
  grantedAt: Date
  expiresAt?: Date
  conditions?: {
    timeRestrictions?: {
      startTime?: string
      endTime?: string
      daysOfWeek?: number[]
    }
    ipRestrictions?: string[]
    locationRestrictions?: string[]
  }
  isActive: boolean
}

// Security Policy Definition
export interface SecurityPolicy {
  id: string
  name: string
  description: string
  type: 'permission' | 'role' | 'resource' | 'session'
  rules: SecurityRule[]
  isActive: boolean
  priority: number
  createdBy: string
  createdAt: Date
  lastModifiedBy: string
  lastModifiedAt: Date
}

// Security Rule Definition
export interface SecurityRule {
  id: string
  condition: {
    type: 'user' | 'role' | 'permission' | 'resource' | 'time' | 'location' | 'device'
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'in'
      | 'not_in'
      | 'greater_than'
      | 'less_than'
    value: unknown
  }
  action: 'allow' | 'deny' | 'require_mfa' | 'log' | 'notify'
  effect: 'permit' | 'deny' | 'indeterminate'
  metadata?: Record<string, unknown>
}

// Audit Log Entry for Security Events
export interface SecurityAuditLog {
  id: string
  timestamp: Date
  userId?: string
  sessionId?: string
  companyId?: string
  eventType: SecurityEventType
  action: string
  resource?: string
  resourceId?: string
  outcome: 'success' | 'failure' | 'blocked'
  ipAddress?: string
  userAgent?: string
  location?: string
  metadata?: Record<string, unknown>
  riskScore?: number
}

// Security Event Types
export type SecurityEventType =
  | 'authentication'
  | 'authorization'
  | 'permission_grant'
  | 'permission_revoke'
  | 'role_assignment'
  | 'role_removal'
  | 'policy_change'
  | 'suspicious_activity'
  | 'security_violation'
  | 'session_management'
  | 'password_change'
  | 'mfa_enrollment'
  | 'mfa_verification'

// Enhanced Session Information
export interface SecuritySession {
  sessionId: string
  userId: string
  companyId?: string
  tokens: AuthTokens
  createdAt: Date
  lastAccessAt: Date
  expiresAt: Date
  ipAddress: string
  userAgent: string
  location?: {
    country?: string
    region?: string
    city?: string
  }
  isActive: boolean
  riskScore: number
  deviceFingerprint?: string
  mfaVerified: boolean
  mfaExpiresAt?: Date
  permissions: Permission[]
  roles: Role[]
}

// Resource Protection Definition
export interface ProtectedResource {
  id: string
  name: string
  type: 'api' | 'page' | 'component' | 'data' | 'file'
  path?: string
  requiredPermissions: Permission[]
  requiredRoles?: Role[]
  requiredAccessLevel: AccessLevel
  ownershipRequired?: boolean
  additionalSecurityRules?: SecurityRule[]
  isPublic: boolean
  metadata?: Record<string, unknown>
}

// Security Validation Result
export interface SecurityValidationResult {
  isValid: boolean
  user?: User
  permissions: Permission[]
  roles: Role[]
  accessLevel: AccessLevel
  violations: SecurityViolation[]
  warnings: SecurityWarning[]
  riskScore: number
  additionalContext?: Record<string, unknown>
}

// Security Violation
export interface SecurityViolation {
  type: 'permission' | 'role' | 'policy' | 'session' | 'rate_limit' | 'suspicious'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  code: string
  timestamp: Date
  userId?: string
  sessionId?: string
  resource?: string
  metadata?: Record<string, unknown>
}

// Security Warning
export interface SecurityWarning {
  type: 'expiring' | 'weak' | 'suspicious' | 'policy'
  message: string
  code: string
  timestamp: Date
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

// Security Configuration
export interface SecurityConfiguration {
  sessionTimeout: number
  maxConcurrentSessions: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number
    preventReuse: number
  }
  mfaPolicy: {
    required: boolean
    methods: string[]
    validityPeriod: number
  }
  rateLimiting: {
    enabled: boolean
    maxRequestsPerMinute: number
    maxRequestsPerHour: number
    blockDuration: number
  }
  auditLogging: {
    enabled: boolean
    events: SecurityEventType[]
    retentionDays: number
  }
  riskAssessment: {
    enabled: boolean
    factors: string[]
    thresholds: {
      low: number
      medium: number
      high: number
    }
  }
}

// JWT Claims with Security Context
export interface SecureJWTClaims {
  sub: string // User ID
  iat: number // Issued at
  exp: number // Expires at
  aud: string // Audience
  iss: string // Issuer
  jti: string // JWT ID
  sessionId: string
  companyId?: string
  roles: Role[]
  permissions: Permission[]
  accessLevel: AccessLevel
  mfaVerified: boolean
  riskScore: number
  deviceId?: string
  ipAddress: string
}

// API Security Headers
export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Content-Type-Options': 'nosniff'
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN' | string
  'X-XSS-Protection': '1; mode=block'
  'Referrer-Policy': string
  'Permissions-Policy'?: string
  'Strict-Transport-Security'?: string
  Authorization: string
  'X-Request-ID': string
  'X-User-ID'?: string
  'X-Company-ID'?: string
  'X-Session-ID'?: string
}

// Type Guards for Security
export const isValidPermission = (permission: unknown): permission is Permission => {
  return typeof permission === 'string' && permission.length > 0
}

export const isValidRole = (role: unknown): role is Role => {
  return typeof role === 'string' && role.length > 0
}

export const isValidAccessLevel = (level: unknown): level is AccessLevel => {
  return (
    typeof level === 'string' && ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN'].includes(level)
  )
}

export const isSecuritySession = (obj: unknown): obj is SecuritySession => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'sessionId' in obj &&
    'userId' in obj &&
    'isActive' in obj
  )
}

export const isProtectedResource = (obj: unknown): obj is ProtectedResource => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'requiredPermissions' in obj &&
    'requiredAccessLevel' in obj
  )
}

// Utility types for strict security
export type StrictPermissionCheck<T extends Permission> = {
  permission: T
  hasAccess: boolean
  reason?: string
}

export type StrictRoleCheck<T extends Role> = {
  role: T
  hasRole: boolean
  reason?: string
}

// Security Action Types for Redux/State Management
export type SecurityAction =
  | { type: 'SECURITY_CHECK_PERMISSION'; payload: { permission: Permission; resource?: string } }
  | { type: 'SECURITY_CHECK_ROLE'; payload: { role: Role } }
  | { type: 'SECURITY_VIOLATION_DETECTED'; payload: SecurityViolation }
  | { type: 'SECURITY_SESSION_EXPIRED'; payload: { sessionId: string } }
  | { type: 'SECURITY_MFA_REQUIRED'; payload: { userId: string; action: string } }
  | { type: 'SECURITY_RISK_ASSESSED'; payload: { riskScore: number; factors: string[] } }

// Export all types for centralized security management - commented to avoid conflicts
// export type { Permission, Role, AccessLevel, User, Company, AuthTokens }
