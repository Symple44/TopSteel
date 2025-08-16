/**
 * Export des interfaces du module Auth
 */

// Interfaces JWT existantes
export {
  JwtPayload,
  MultiTenantJwtPayload,
} from './jwt-payload.interface'

// Interfaces de vérification MFA
export {
  IMFAVerification,
  IInitiateMFAVerification,
  IVerifyMFACode,
  IMFAVerificationResult,
  IUserMFAConfiguration,
  IMFAVerificationFilters,
  IMFAStatistics,
  MFAMethodType,
  MFAVerificationStatus,
} from './mfa-verification.interface'

// Interfaces des permissions utilisateur
export {
  IUserPermission,
  IUserPermissions,
  IPermissionRequest,
  IUserPermissionFilters,
  IPermissionStatistics,
  PermissionType,
  PermissionContext,
  PermissionLevel,
  PermissionStatus,
} from './user-permissions.interface'

// Interfaces des logs d'audit
export {
  IAuditLog,
  IAuditLogFilters,
  IAuditLogSortOptions,
  IAuditStatistics,
  IAuditConfiguration,
  AuditEventType,
  AuditSeverity,
  AuditEventStatus,
  AuditCategory,
} from './audit-log.interface'