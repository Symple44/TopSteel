/**
 * Types pour les entités User
 * Créé pour résoudre les erreurs TypeScript TS18046 et TS2345
 */

import type { GlobalUserRole } from '../../domains/auth/core/constants/roles.constants'

export interface UserData {
  id: string
  email: string
  nom: string
  prenom: string
  username?: string
  role?: string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

/**
 * Extended User interface with additional properties needed by controllers
 * Includes firstName, lastName, currentSocieteId and role for compatibility
 */
export interface ExtendedUser {
  id: string
  email: string
  nom?: string
  prenom?: string
  // Legacy compatibility fields
  firstName?: string
  lastName?: string
  // Current société context
  currentSocieteId?: string
  societeId?: string
  role: GlobalUserRole
  actif: boolean
  // Additional fields
  acronyme?: string
  dernier_login?: Date
  refreshToken?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface UserWithRelations extends UserData {
  societes?: UserSocieteRole[]
  permissions?: string[]
  mfaEnabled?: boolean
}

export interface UserSocieteRole {
  id: string
  userId: string
  societeId: string
  roleId: string
  role: RoleData
  isActive: boolean
  isDefault: boolean
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface RoleData {
  id: string
  name: string
  code: string
  parentRoleType?: string
  level?: number
  rolePermissions: RolePermission[]
  description?: string
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  permission: PermissionData
  granted: boolean
}

export interface PermissionData {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description?: string
}

export interface UserSession {
  id: string
  userId: string
  token: string
  ipAddress: string
  userAgent: string
  expiresAt: Date | string
  isActive: boolean
  createdAt: Date | string
}

export interface UserPreferences {
  userId: string
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  timezone?: string
  notifications?: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard?: {
    layout: string
    widgets: string[]
  }
}
