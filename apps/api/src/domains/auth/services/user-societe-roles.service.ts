/**
 * UserSocieteRolesService - STUB for TypeScript compilation
 *
 * This is a minimal stub that allows TypeScript to compile.
 * The actual implementation is in UserSocieteRolesPrismaService, which is aliased
 * to this service in auth.module.ts.
 *
 * Original implementation moved to: user-societe-roles.service.ts.disabled
 */
import { Injectable } from '@nestjs/common'

export interface UserSocieteRoleWithPermissions {
  userId: string
  societeId: string
  societe: {
    id: string
    nom: string
    code: string
  }
  roleType: string
  isDefaultSociete: boolean
  role?: {
    id: string
    name: string
    parentRoleType?: string
    priority: number
  }
  permissions: Array<{
    id: string
    name: string
    resource: string
    action: string
    accessLevel: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
    isGranted: boolean
  }>
  additionalPermissions: string[]
  restrictedPermissions: string[]
  isDefault: boolean
  isActive: boolean
}

@Injectable()
export class UserSocieteRolesService {
  // This class is just a stub for dependency injection aliasing
  // The real implementation is UserSocieteRolesPrismaService

  async findUserRolesInSocietes(userId: string): Promise<UserSocieteRoleWithPermissions[]> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async getEffectiveUserRole(userId: string, societeId: string): Promise<string> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async hasPermission(
    userId: string,
    societeId: string,
    resource: string,
    action: string,
    requiredLevel: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' = 'READ'
  ): Promise<boolean> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async assignRole(
    userId: string,
    societeId: string,
    roleId: string,
    grantedById: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async revokeRole(userId: string, societeId: string): Promise<void> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async setDefaultSociete(userId: string, societeId: string): Promise<void> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async addAdditionalPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async removeAdditionalPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async addRestrictedPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async removeRestrictedPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async getUserPermissionsSummary(userId: string, societeId: string): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }

  async getUserEffectivePermissions(
    userId: string,
    societeId: string,
    siteId?: string
  ): Promise<any> {
    throw new Error(
      'UserSocieteRolesService stub should never be called - check aliasing in auth.module.ts'
    )
  }
}
