/**
 * QueryBuilderPermissionService - Refactored to use Prisma
 * Provides backward compatibility layer for permission checking
 */

import { Injectable } from '@nestjs/common'
import { QueryBuilderPermissionPrismaService } from '../../../domains/query-builder/prisma/query-builder-permission-prisma.service'
import type { PermissionType } from '../entities'

@Injectable()
export class QueryBuilderPermissionService {
  constructor(
    private readonly permissionPrisma: QueryBuilderPermissionPrismaService
  ) {}

  async checkPermission(
    queryBuilderId: string,
    userId: string,
    permissionType: PermissionType
  ): Promise<boolean> {
    const permission = await this.permissionPrisma.getQueryBuilderPermissionForUser(
      queryBuilderId,
      userId
    )

    if (!permission) {
      return false
    }

    // Map permission type to boolean flag
    switch (permissionType) {
      case 'view':
        return permission.canView
      case 'edit':
        return permission.canEdit
      case 'delete':
        return permission.canDelete
      case 'share':
        return permission.canShare || false
      default:
        return false
    }
  }

  async addPermission(data: {
    queryBuilderId: string
    userId: string
    permissionType: PermissionType
    isAllowed: boolean
  }): Promise<void> {
    // Check if permission already exists
    const existing = await this.permissionPrisma.getQueryBuilderPermissionForUser(
      data.queryBuilderId,
      data.userId
    )

    if (existing) {
      // Update existing permission
      const updateData: any = {}
      if (data.permissionType === 'view') updateData.canView = data.isAllowed
      if (data.permissionType === 'edit') updateData.canEdit = data.isAllowed
      if (data.permissionType === 'delete') updateData.canDelete = data.isAllowed
      if (data.permissionType === 'share') updateData.canShare = data.isAllowed

      await this.permissionPrisma.updateQueryBuilderPermission(existing.id, updateData)
    } else {
      // Create new permission
      const createData: any = {
        queryBuilderId: data.queryBuilderId,
        userId: data.userId,
        canView: data.permissionType === 'view' ? data.isAllowed : false,
        canEdit: data.permissionType === 'edit' ? data.isAllowed : false,
        canDelete: data.permissionType === 'delete' ? data.isAllowed : false,
        canShare: data.permissionType === 'share' ? data.isAllowed : false,
      }

      await this.permissionPrisma.createQueryBuilderPermission(createData)
    }
  }

  async removePermission(
    queryBuilderId: string,
    userId: string,
    permissionType: PermissionType
  ): Promise<void> {
    const permission = await this.permissionPrisma.getQueryBuilderPermissionForUser(
      queryBuilderId,
      userId
    )

    if (permission) {
      // Set the specific permission to false
      const updateData: any = {}
      if (permissionType === 'view') updateData.canView = false
      if (permissionType === 'edit') updateData.canEdit = false
      if (permissionType === 'delete') updateData.canDelete = false
      if (permissionType === 'share') updateData.canShare = false

      await this.permissionPrisma.updateQueryBuilderPermission(permission.id, updateData)
    }
  }

  async getPermissions(queryBuilderId: string) {
    return this.permissionPrisma.getQueryBuilderPermissions(queryBuilderId)
  }

  async getUserPermissions(userId: string) {
    return this.permissionPrisma.getQueryBuilderPermissionsByUser(userId)
  }
}
