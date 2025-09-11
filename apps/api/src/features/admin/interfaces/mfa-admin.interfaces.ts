/**
 * TypeScript interfaces for MFA Admin Controller
 * Replaces all 'unknown' types with proper type definitions
 */

/**
 * Main MFA status data returned by getAdminMFAStatus()
 */
export interface MFAStatusData {
  totalUsers: number
  usersWithMFA: number
  usersByRole: UsersByRoleStats
  mfaMethodDistribution: MFAMethodDistribution
}

/**
 * Distribution of MFA methods usage across users
 */
export interface MFAMethodDistribution {
  totp?: number
  sms?: number
  webauthn?: number
  [method: string]: number | undefined
}

/**
 * User statistics grouped by role
 */
export interface UsersByRoleStats {
  SUPER_ADMIN?: RoleStats
  ADMIN?: RoleStats
  MANAGER?: RoleStats
  USER?: RoleStats
  [role: string]: RoleStats | undefined
}

/**
 * Statistics for a specific role
 */
export interface RoleStats {
  total: number
  withMFA: number
}

/**
 * MFA security statistics for individual users
 */
export interface MFASecurityStats {
  hasActiveMFA: boolean
  methods: {
    totp: {
      enabled: boolean
      verified: boolean
      lastUsed?: Date
    }
    webauthn: {
      enabled: boolean
      verified: boolean
      credentialsCount: number
      lastUsed?: Date
    }
    sms: {
      enabled: boolean
      verified: boolean
      lastUsed?: Date
    }
  }
  totalUsage: number
  securityLevel: 'none' | 'basic' | 'enhanced'
}

/**
 * Extended MFA status with additional fields for admin operations
 */
export interface ExtendedMFAStatusData extends MFAStatusData {
  complianceRate: number
  recommendations: string[]
  timestamp: Date
}

/**
 * MFA health check data
 */
export interface MFAHealthData {
  overall: 'healthy' | 'warning' | 'critical'
  checks: {
    mfaAdoption: HealthCheck
    recentActivity: HealthCheck
    methodDiversity: HealthCheck
  }
  recommendations: string[]
}

/**
 * Individual health check result
 */
export interface HealthCheck {
  status: 'good' | 'warning' | 'critical' | 'info'
  value: string | number
  threshold?: string
  description?: string
}

/**
 * User MFA method information for admin view
 */
export interface UserMFAMethodInfo {
  id: string
  type: 'totp' | 'sms' | 'webauthn'
  isEnabled: boolean
  isVerified: boolean
  lastUsed?: Date | string
  createdAt: Date
  metadata: {
    usageCount: number
    failedAttempts: number
    deviceInfo?: Array<{
      deviceName: string
      createdAt: Date
    }>
  }
}

/**
 * User MFA compliance information
 */
export interface MFAComplianceInfo {
  status: 'compliant' | 'non_compliant' | 'voluntary' | 'not_applicable'
  recommendation: string
}

/**
 * Complete user MFA status for admin view
 */
export interface UserMFAStatusData {
  userId: string
  hasMFAEnabled: boolean
  isMFARequired: boolean
  methods: UserMFAMethodInfo[]
  stats: MFASecurityStats
  compliance: MFAComplianceInfo
}

/**
 * MFA session information for admin monitoring
 */
export interface MFASessionInfo {
  id: string
  userId: string
  sessionToken: string
  status: 'pending' | 'verified' | 'expired' | 'failed'
  mfaType: 'totp' | 'sms' | 'webauthn'
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
  attemptsCount: number
}

/**
 * MFA analytics data
 */
export interface MFAAnalyticsData {
  period: string
  mfaUsage: {
    totalAuthentications: number
    successfulAuthentications: number
    failedAuthentications: number
    expiredSessions: number
  }
  methodPopularity: Record<string, number>
  securityMetrics: {
    averageAttemptsPerSession: number
    mostActiveHours: number[]
    topFailureReasons: Record<string, number>
  }
  trends: {
    adoptionRate: number
    usageGrowth: number
  }
}

/**
 * MFA reset operation data
 */
export interface MFAResetData {
  resetCount: number
  disableOnly: boolean
  reason: string
  timestamp: Date
}

/**
 * Type guards for better type safety
 */

export function isMFAStatusData(obj: unknown): obj is MFAStatusData {
  if (obj === null || typeof obj !== 'object') {
    return false
  }
  
  const candidate = obj as Record<string, unknown>
  return (
    typeof candidate.totalUsers === 'number' &&
    typeof candidate.usersWithMFA === 'number' &&
    typeof candidate.usersByRole === 'object' &&
    candidate.usersByRole !== null &&
    typeof candidate.mfaMethodDistribution === 'object' &&
    candidate.mfaMethodDistribution !== null
  )
}

export function isMFASecurityStats(obj: unknown): obj is MFASecurityStats {
  if (obj === null || typeof obj !== 'object') {
    return false
  }
  
  const candidate = obj as Record<string, unknown>
  return (
    typeof candidate.hasActiveMFA === 'boolean' &&
    typeof candidate.methods === 'object' &&
    candidate.methods !== null &&
    typeof candidate.totalUsage === 'number' &&
    typeof candidate.securityLevel === 'string' &&
    ['none', 'basic', 'enhanced'].includes(candidate.securityLevel)
  )
}

/**
 * Default/empty implementations for testing and fallbacks
 */

export const createEmptyMFAStatusData = (): MFAStatusData => ({
  totalUsers: 0,
  usersWithMFA: 0,
  usersByRole: {},
  mfaMethodDistribution: {},
})

export const createEmptyMFASecurityStats = (): MFASecurityStats => ({
  hasActiveMFA: false,
  methods: {
    totp: { enabled: false, verified: false },
    webauthn: { enabled: false, verified: false, credentialsCount: 0 },
    sms: { enabled: false, verified: false },
  },
  totalUsage: 0,
  securityLevel: 'none',
})
