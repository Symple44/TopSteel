/**
 * Export des interfaces du module Auth
 */

// Interfaces des logs d'audit
export {
  AuditCategory,
  AuditEventStatus,
  AuditEventType,
  AuditSeverity,
} from './audit-log.interface'
export type {
  IAuditConfiguration,
  IAuditLog,
  IAuditLogFilters,
  IAuditLogSortOptions,
  IAuditStatistics,
} from './audit-log.interface'
// Interfaces JWT existantes
export type {
  JwtPayload,
  MultiTenantJwtPayload,
} from './jwt-payload.interface'
// Interfaces de vérification MFA
export {
  MFAMethodType,
  MFAVerificationStatus,
} from './mfa-verification.interface'
export type {
  IInitiateMFAVerification,
  IMFAStatistics,
  IMFAVerification,
  IMFAVerificationFilters,
  IMFAVerificationResult,
  IUserMFAConfiguration,
  IVerifyMFACode,
} from './mfa-verification.interface'
// Interfaces des permissions utilisateur
export {
  PermissionContext,
  PermissionLevel,
  PermissionStatus,
  PermissionType,
} from './user-permissions.interface'
export type {
  IPermissionRequest,
  IPermissionStatistics,
  IUserPermission,
  IUserPermissionFilters,
  IUserPermissions,
} from './user-permissions.interface'
