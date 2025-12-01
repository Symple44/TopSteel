/**
 * Type guards for admin controllers
 * These guards provide safe type checking without using 'as' castings
 */

import type { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'

/**
 * Type guard for authenticated user in request
 */
export interface AuthenticatedUser {
  id: string
  email?: string
  role?: string
  societeId?: string
  [key: string]: unknown
}

export function isAuthenticatedUser(user: unknown): user is AuthenticatedUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    typeof (user as { id: unknown }).id === 'string'
  )
}

/**
 * Type guard for user with tenant context
 */
export interface UserWithTenant extends AuthenticatedUser {
  societeId: string
}

export function isUserWithTenant(user: unknown): user is UserWithTenant {
  return (
    isAuthenticatedUser(user) &&
    'societeId' in user &&
    typeof (user as { societeId: unknown }).societeId === 'string'
  )
}

/**
 * Type guard for database errors
 */
export interface DatabaseError {
  code?: string
  message?: string
  [key: string]: unknown
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error)
  )
}

/**
 * Type guard for user with societe role
 */
export interface AdminUserWithSocieteRole {
  id: string
  email: string
  prenom?: string | null
  nom?: string | null
  acronyme?: string | null
  actif?: boolean
  createdAt?: Date | null
  dernier_login?: Date | null
  role?: string
  [key: string]: unknown
}

export function isAdminUserWithSocieteRole(user: unknown): user is AdminUserWithSocieteRole {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    typeof (user as { id: unknown }).id === 'string' &&
    typeof (user as { email: unknown }).email === 'string'
  )
}

/**
 * Type guard for array of admin users
 */
export function isAdminUserArray(users: unknown): users is AdminUserWithSocieteRole[] {
  return Array.isArray(users) && users.every(isAdminUserWithSocieteRole)
}

/**
 * Type guard for Prisma entity with sites
 */
export interface EntityWithSites<T> {
  sites?: T[]
  [key: string]: unknown
}

export function hasOptionalSites<T>(entity: unknown): entity is EntityWithSites<T> {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    (!('sites' in entity) || Array.isArray((entity as { sites: unknown }).sites))
  )
}
