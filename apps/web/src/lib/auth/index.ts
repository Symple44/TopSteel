// Exports publics du module d'authentification

// Adaptateur pour intégration existant
export { AuthAdapter } from './auth-adapter'
export { useAuth } from './auth-context'
// Provider et Context
export { AuthProvider } from './auth-provider'
// Storage (pour usage avancé)
export { authStorage } from './auth-storage'
// Types de base
export type {
  AuthBroadcastEvent,
  AuthConfig,
  AuthContextType,
  AuthState,
  AuthTokens,
  Company,
  CompanySelectionResponse,
  LoginResponse,
  MFAState,
  MFAVerificationResponse,
  StoredSession,
  User,
} from './auth-types'
// API RBAC
export { RBACApi } from './rbac-api'
// Composants RBAC
export {
  AccessDenied,
  AccessGuard,
  AdminGuard,
  ConditionalRender,
  ModuleGuard,
  PermissionGuard,
  PermissionsGuard,
  PolicyGuard,
  RoleLevelGuard,
  SuperAdminGuard,
} from './rbac-components'
// Hooks RBAC
export {
  useAccessPolicy,
  useConditionalRender,
  useEffectivePermissions,
  useIsAdmin,
  useIsSuperAdmin,
  useModuleAccess,
  usePermission,
  usePermissions,
  useResourceActions,
  useRoleLevel,
} from './rbac-hooks'
// Service RBAC
export { RBACService, rbacService } from './rbac-service'
// Types RBAC avancés
export type {
  AccessCondition,
  AccessContext,
  AccessPolicy,
  AuditLog,
  ExtendedUser,
  MFAMethod,
  MFASettings,
  Permission,
  PermissionAction,
  RBACConfig,
  Role,
  UserSession,
  UserSocieteRole,
} from './rbac-types'
