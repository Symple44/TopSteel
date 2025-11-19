import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../../domains/users/entities/user.entity'
import { type PermissionType, QueryBuilderPermission } from '../entities'

@Injectable()
export class QueryBuilderPermissionService {
  constructor(
    @InjectRepository(QueryBuilderPermission, 'auth')
    private _permissionRepository: Repository<QueryBuilderPermission>,
    @InjectRepository(User, 'auth')
    private userRepository: Repository<User>
  ) {}

  async checkPermission(
    queryBuilderId: string,
    userId: string,
    permissionType: PermissionType
  ): Promise<boolean> {
    // Check user-specific permission
    const userPermission = await this._permissionRepository.findOne({
      where: {
        queryBuilderId,
        userId,
        permissionType,
      },
    })

    if (userPermission) {
      return userPermission.isAllowed
    }

    // Check role-based permissions
    // First get user's roles
    const userRoles = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.userId = user.id')
      .select('ur.roleId')
      .where('user.id = :userId', { userId })
      .getRawMany()

    const roleIds = userRoles.map((ur) => ur.ur_roleId).filter(Boolean)

    if (roleIds.length > 0) {
      // Check permissions for these roles
      const rolePermissions = await this._permissionRepository.find({
        where: roleIds.map((roleId) => ({
          queryBuilderId,
          roleId,
          permissionType,
        })),
      })

      // If any role grants permission, allow it
      const roleGrantsPermission = rolePermissions.some((p) => p.isAllowed)
      if (roleGrantsPermission) {
        return true
      }

      // If any role explicitly denies permission, deny it
      const roleDeniesPermission = rolePermissions.some((p) => !p.isAllowed)
      if (roleDeniesPermission) {
        return false
      }
    }

    // Default behavior based on permission type and system configuration
    return this.getDefaultPermission(permissionType)
  }

  async addPermission(data: {
    queryBuilderId: string
    userId?: string
    roleId?: string
    permissionType: PermissionType
    isAllowed: boolean
  }): Promise<QueryBuilderPermission> {
    const permission = this._permissionRepository.create(data)
    return this._permissionRepository.save(permission)
  }

  async removePermission(id: string): Promise<void> {
    await this._permissionRepository.delete(id)
  }

  async getPermissions(queryBuilderId: string): Promise<QueryBuilderPermission[]> {
    return this._permissionRepository.find({
      where: { queryBuilderId },
      relations: ['user', 'role'],
    })
  }

  async updatePermission(id: string, isAllowed: boolean): Promise<QueryBuilderPermission> {
    await this._permissionRepository.update(id, { isAllowed })
    const permission = await this._permissionRepository.findOne({ where: { id } })
    if (!permission) {
      throw new Error(`Permission with id ${id} not found`)
    }
    return permission
  }

  /**
   * Get default permission for a given permission type
   */
  private getDefaultPermission(permissionType: PermissionType): boolean {
    switch (permissionType) {
      case 'view':
        return true // Allow view by default for backward compatibility
      case 'edit':
        return false // Require explicit permission to edit
      case 'delete':
        return false // Require explicit permission to delete
      case 'share':
        return false // Require explicit permission to share
      case 'export':
        return true // Allow export by default (can be restricted)
      default:
        return false // Deny unknown permissions by default
    }
  }

  /**
   * Get user's role-based permissions for a specific query builder
   */
  async getUserRolePermissions(
    queryBuilderId: string,
    userId: string
import { User } from '@prisma/client'
  ): Promise<Array<{ roleId: string; roleName: string; permissions: PermissionType[] }>> {
    const userRoles = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.userId = user.id')
      .leftJoin('roles', 'role', 'role.id = ur.roleId')
      .select(['ur.roleId', 'role.name'])
      .where('user.id = :userId', { userId })
      .getRawMany()

    const result = []

    for (const userRole of userRoles) {
      if (!userRole.ur_roleId) continue

      const permissions = await this._permissionRepository.find({
        where: {
          queryBuilderId,
          roleId: userRole.ur_roleId,
          isAllowed: true,
        },
      })

      result.push({
        roleId: userRole.ur_roleId,
        roleName: userRole.role_name || 'Unknown Role',
        permissions: permissions.map((p) => p.permissionType),
      })
    }

    return result
  }

  /**
   * Check if user has any permissions for a query builder
   */
  async hasAnyPermission(queryBuilderId: string, userId: string): Promise<boolean> {
    const permissionTypes: PermissionType[] = ['view', 'edit', 'delete', 'share', 'export']

    for (const permissionType of permissionTypes) {
      if (await this.checkPermission(queryBuilderId, userId, permissionType)) {
        return true
      }
    }

    return false
  }

  /**
   * Get all user permissions for a query builder
   */
  async getUserPermissions(
    queryBuilderId: string,
    userId: string
  ): Promise<Record<PermissionType, boolean>> {
    const permissionTypes: PermissionType[] = ['view', 'edit', 'delete', 'share', 'export']
    const permissions: Record<PermissionType, boolean> = {} as Record<PermissionType, boolean>

    for (const permissionType of permissionTypes) {
      permissions[permissionType] = await this.checkPermission(
        queryBuilderId,
        userId,
        permissionType
      )
    }

    return permissions
  }

  /**
   * Grant permission to a user or role
   */
  async grantPermission(
    queryBuilderId: string,
    targetId: string,
    targetType: 'user' | 'role',
    permissionType: PermissionType
  ): Promise<QueryBuilderPermission> {
    const data = {
      queryBuilderId,
      permissionType,
      isAllowed: true,
      ...(targetType === 'user' ? { userId: targetId } : { roleId: targetId }),
    }

    return this.addPermission(data)
  }

  /**
   * Revoke permission from a user or role
   */
  async revokePermission(
    queryBuilderId: string,
    targetId: string,
    targetType: 'user' | 'role',
    permissionType: PermissionType
  ): Promise<void> {
    const whereCondition = {
      queryBuilderId,
      permissionType,
      ...(targetType === 'user' ? { userId: targetId } : { roleId: targetId }),
    }

    const permission = await this._permissionRepository.findOne({ where: whereCondition })
    if (permission) {
      await this._permissionRepository.delete(permission.id)
    }
  }
}
