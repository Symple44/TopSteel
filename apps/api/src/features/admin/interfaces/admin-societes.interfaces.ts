/**
 * Interfaces for Admin Societes Controller
 * Replaces all 'any' types with proper TypeScript interfaces
 */

import type { SocieteRoleType } from '../../../domains/auth/core/constants/roles.constants'

export interface AdminUserWithSocieteRole {
  id: string
  email: string
  prenom?: string
  nom?: string
  role?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface UserSocieteRoleInfo {
  id: string
  userId: string
  societeId: string
  roleType: SocieteRoleType
  effectiveRole: SocieteRoleType
  isActive: boolean
  isDefaultSociete: boolean
  additionalPermissions: string[]
  restrictedPermissions: string[]
  grantedAt: Date | string
  grantedBy?: string
  expiresAt?: Date | string
}

export interface FormattedUserForSociete {
  id: string
  email: string
  firstName: string
  lastName: string
  globalRole: {
    id: string
    name: string
    displayName: string
    description: string
    type: 'global' | 'societe'
    hierarchy: number
    color: string
    icon: string
    isSystemRole?: boolean
  }
  societeRole: {
    id: string
    name: string
    displayName: string
    description: string
    type: 'global' | 'societe'
    hierarchy: number
    color: string
    icon: string
    isSystemRole?: boolean
  } | null
  isDefault: boolean
  isActive?: boolean
  grantedAt: Date | string
  expiresAt?: Date | string
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
}

export interface SocieteWithUserInfo {
  id: string
  nom: string
  code: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date | string
  updatedAt: Date | string
  userCount: number
  users?: FormattedUserForSociete[]
  sites: SiteInfo[]
}

export interface SiteInfo {
  id: string
  nom: string
  code: string
  isPrincipal: boolean
}

export interface SocietesListResponse {
  success: boolean
  data: SocieteWithUserInfo[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    includeUsers: boolean
  }
}

export interface SocieteDetailsResponse {
  success: boolean
  data: {
    id: string
    nom: string
    code: string
    status: 'ACTIVE' | 'INACTIVE'
    databaseName?: string
    createdAt: Date | string
    updatedAt: Date | string
    users: FormattedUserForSociete[]
    sites: SiteInfo[]
  }
}

export interface AddUserToSocieteBody {
  roleType: SocieteRoleType
  isDefault?: boolean
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
  expiresAt?: Date
}

export interface AddUserToSocieteResponse {
  success: boolean
  data: {
    id: string
    userId: string
    societeId: string
    roleType: SocieteRoleType
    isDefault: boolean
    isActive: boolean
    grantedAt: Date | string
    grantedBy: string
  }
  message: string
  statusCode: number
}

export interface UpdateUserRoleBody {
  roleType: SocieteRoleType
  isDefault?: boolean
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
  expiresAt?: Date
}

export interface UpdateUserRoleResponse {
  success: boolean
  data: {
    id: string
    userId: string
    societeId: string
    roleType: SocieteRoleType
    isDefault: boolean
    isActive: boolean
    grantedAt: Date | string
  }
  message: string
  statusCode: number
}

export interface RemoveUserFromSocieteResponse {
  success: boolean
  message: string
  statusCode: number
}

export interface RoleDistribution {
  role: {
    id: string
    name: string
    displayName: string
    description: string
    type: 'global' | 'societe'
    hierarchy: number
    color: string
    icon: string
    isSystemRole?: boolean
  }
  count: number
}

export interface SocieteStatsResponse {
  success: boolean
  data: {
    societeId: string
    societeName: string
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    roleDistribution: RoleDistribution[]
    sitesCount: number
  }
}

export interface AuthenticatedRequest {
  user: {
    id: string
    email: string
    role: string
    societeId?: string
  }
}
