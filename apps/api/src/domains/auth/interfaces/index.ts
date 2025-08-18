/**
 * Export des interfaces du module Auth
 */

// Interfaces des logs d'audit
export {
  AuditCategory,
  AuditEventStatus,
  AuditEventType,
  AuditSeverity,
  IAuditConfiguration,
  IAuditLog,
  IAuditLogFilters,
  IAuditLogSortOptions,
  IAuditStatistics,
} from './audit-log.interface'
// Interfaces JWT existantes
export {
  JwtPayload,
  MultiTenantJwtPayload,
} from './jwt-payload.interface'
// Interfaces de vérification MFA
export {
  IInitiateMFAVerification,
  IMFAStatistics,
  IMFAVerification,
  IMFAVerificationFilters,
  IMFAVerificationResult,
  IUserMFAConfiguration,
  IVerifyMFACode,
  MFAMethodType,
  MFAVerificationStatus,
} from './mfa-verification.interface'
// Interfaces des permissions utilisateur
export {
  IPermissionRequest,
  IPermissionStatistics,
  IUserPermission,
  IUserPermissionFilters,
  IUserPermissions,
  PermissionContext,
  PermissionLevel,
  PermissionStatus,
  PermissionType,
} from './user-permissions.interface'
