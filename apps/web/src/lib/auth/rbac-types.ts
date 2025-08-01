// Types avancés pour RBAC (Role-Based Access Control)
import type { Company } from './auth-types'

// Re-export Company for convenience
export type { Company }

// Permissions granulaires par module
export interface Permission {
  id: string
  code: string // Ex: "USERS_CREATE", "INVENTORY_READ", "REPORTS_EXPORT"
  module: string // Ex: "users", "inventory", "reports"
  action: PermissionAction // Ex: "create", "read", "update", "delete"
  resource?: string // Ressource spécifique (optionnel)
  description: string
}

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'view_all'
  | 'view_own'
  | 'manage'

// Rôles avec hiérarchie
export interface Role {
  id: string
  code: string // Ex: "ADMIN", "MANAGER", "USER", "VIEWER"
  name: string
  description: string
  level: number // Hiérarchie: 1=SUPER_ADMIN, 2=ADMIN, 3=MANAGER, 4=USER
  permissions: Permission[]
  isSystemRole: boolean // Rôles système non modifiables
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Association utilisateur-société-rôle avec permissions spécifiques
export interface UserSocieteRole {
  id: string
  userId: string
  societeId: string
  roleId: string
  role: Role
  isDefault: boolean // Rôle par défaut pour toutes les sociétés
  isActive: boolean
  // Permissions additionnelles spécifiques (au-delà du rôle)
  additionalPermissions?: Permission[]
  // Permissions explicitement refusées
  deniedPermissions?: Permission[]
  // Dates de validité
  validFrom?: string
  validTo?: string
  createdAt: string
  updatedAt: string
}

// Utilisateur étendu avec rôles par société
export interface ExtendedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  // Rôle par défaut (pour nouvelles sociétés)
  defaultRoleId?: string
  defaultRole?: Role
  // Rôles spécifiques par société
  societeRoles: UserSocieteRole[]
  // Permissions effectives pour la société courante
  effectivePermissions?: Permission[]
  // Sessions actives
  activeSessions?: UserSession[]
  // Paramètres MFA
  mfaSettings?: MFASettings
  createdAt: string
  updatedAt: string
}

// Sessions utilisateur pour audit
export interface UserSession {
  id: string
  userId: string
  societeId?: string
  deviceInfo: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  lastActivity: string
  createdAt: string
  expiresAt: string
}

// Paramètres MFA avancés
export interface MFASettings {
  enabled: boolean
  methods: MFAMethod[]
  backupCodes: number
  lastUsed?: string
  mandatory: boolean // MFA obligatoire pour ce user
}

export interface MFAMethod {
  id: string
  type: 'totp' | 'sms' | 'email' | 'webauthn' | 'backup_codes'
  name: string
  isActive: boolean
  isPrimary: boolean
  metadata?: Record<string, any> // Config spécifique au type
  createdAt: string
  lastUsed?: string
}

// Contexte d'accès pour permissions
export interface AccessContext {
  user: ExtendedUser
  societe: Company
  currentRole: Role
  effectivePermissions: Permission[]
  sessionInfo: {
    id: string
    ipAddress: string
    deviceInfo: string
    lastActivity: string
  }
}

// Politique d'accès pour une ressource
export interface AccessPolicy {
  resource: string // Ex: "/admin/users", "UserComponent", "user:123"
  requiredPermissions: string[] // Codes de permissions requises
  mode: 'ALL' | 'ANY' // Toutes les permissions ou au moins une
  conditions?: AccessCondition[]
}

export interface AccessCondition {
  type: 'time' | 'ip' | 'device' | 'custom'
  rule: string
  params?: Record<string, any>
}

// Audit trail
export interface AuditLog {
  id: string
  userId: string
  societeId: string
  action: string // Ex: "USER_LOGIN", "PERMISSION_GRANTED", "DATA_EXPORT"
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  success: boolean
  errorMessage?: string
}

// Configuration RBAC
export interface RBACConfig {
  enableAudit: boolean
  enableSessionTracking: boolean
  maxActiveSessions: number
  permissionCacheTime: number // Minutes
  mfaGracePeriod: number // Minutes après login sans MFA
  defaultPermissions: string[] // Permissions accordées à tous
}
