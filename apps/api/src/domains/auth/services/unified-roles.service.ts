/**
 * UnifiedRolesService - STUB for TypeScript compilation
 *
 * This is a minimal stub that allows TypeScript to compile.
 * The actual implementation is in UnifiedRolesPrismaService, which is aliased
 * to this service in auth.module.ts.
 *
 * Original implementation moved to: unified-roles.service.ts.disabled
 */
import { Injectable } from '@nestjs/common'
import type { SocieteRoleType } from '../core/constants/roles.constants'
import type { UserSocieteRole } from '@prisma/client'

/**
 * Interface for UserSocieteInfo returned by getUserSocieteRoles
 * Exported for use in controllers and other services
 */
export interface UserSocieteInfo {
  id: string
  userId: string
  societeId: string
  societeRole: SocieteRoleType
  effectiveRole: SocieteRoleType
  isActive: boolean
  isDefaultSociete: boolean
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
  grantedAt: Date
  grantedBy?: string | null
  expiresAt?: Date | null
  globalRole?: string
  permissions?: string[]
  societe?: {
    id: string
    nom: string
    code: string
    sites?: Array<{
      id: string
      nom: string
      code: string
    }>
  }
}

/**
 * Options for assigning a user to a societe
 */
export interface AssignUserToSocieteOptions {
  isDefault?: boolean
  additionalPermissions?: string[]
  restrictedPermissions?: string[]
  expiresAt?: Date
}

@Injectable()
export class UnifiedRolesService {
  // This class is just a stub for dependency injection aliasing
  // The real implementation is UnifiedRolesPrismaService

  async getUserSocieteRoles(userId: string): Promise<UserSocieteInfo[]> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async getUserSocieteRole(userId: string, societeId: string): Promise<UserSocieteInfo | null> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async getUserDefaultSocieteRole(userId: string): Promise<UserSocieteInfo | null> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async assignRoleToUser(data: any): Promise<UserSocieteRole> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async removeRoleFromUser(userId: string, societeId: string): Promise<void> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async setDefaultSociete(userId: string, societeId: string): Promise<void> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async validateRoleAssignment(data: any): Promise<any> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async getUserPermissionsForSociete(userId: string, societeId: string): Promise<string[]> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async canManageUserRoles(managerId: string, targetUserId: string): Promise<boolean> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async canManageUsersInSociete(userId: string, societeId: string): Promise<boolean> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  async canUserManageOtherUser(managerId: string, targetUserId: string, societeId: string): Promise<boolean> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  /**
   * Assign a user to a societe with a specific role
   * @param userId - User ID to assign
   * @param societeId - Societe ID to assign to
   * @param roleType - Role type to assign
   * @param assignedBy - User ID who is performing the assignment
   * @param options - Additional options for the assignment
   * @returns The created UserSocieteRole
   */
  async assignUserToSociete(
    userId: string,
    societeId: string,
    roleType: SocieteRoleType,
    assignedBy: string,
    options?: AssignUserToSocieteOptions
  ): Promise<UserSocieteRole> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  /**
   * Revoke a user's access to a societe
   * @param userId - User ID to revoke
   * @param societeId - Societe ID to revoke from
   * @returns True if successful, false if user or role not found
   */
  async revokeUserFromSociete(userId: string, societeId: string): Promise<boolean> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }

  /**
   * Cleanup expired roles by deactivating them
   * @returns Number of roles that were cleaned up
   */
  async cleanupExpiredRoles(): Promise<number> {
    throw new Error('UnifiedRolesService stub should never be called - check aliasing in auth.module.ts')
  }
}
