import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Role, Permission, RolePermission } from '@prisma/client'
import { getErrorMessage } from '../../../core/common/utils'

/**
 * Service de gestion des rôles admin
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère les permissions d'un rôle
   */
  async getRolePermissions(roleId: string) {
    try {
      // D'abord chercher par nom
      let role = await this.prisma.role.findUnique({
        where: { name: roleId },
      })

      // Si pas trouvé et que roleId ressemble à un UUID, chercher par ID
      if (
        !role &&
        roleId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ) {
        role = await this.prisma.role.findUnique({
          where: { id: roleId },
        })
      }

      if (!role) {
        throw new NotFoundException(`Role '${roleId}' not found`)
      }

      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true },
      })

      const permissions = rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        moduleId: rp.permission.resource,
        action: rp.permission.action,
      }))

      return {
        success: true,
        data: {
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
          },
          rolePermissions: permissions,
        },
        statusCode: 200,
        message: 'Success',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new Error(
        `Failed to get permissions for role ${roleId}: ${error instanceof Error ? getErrorMessage(error) : 'Unknown error'}`
      )
    }
  }

  /**
   * Récupère tous les rôles actifs
   */
  async getAllRoles() {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        isSystem: role.isSystem,
        level: role.level,
      })),
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Récupère un rôle par ID
   */
  async getRoleById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    return {
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        isSystem: role.isSystem,
        level: role.level,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      },
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Crée un nouveau rôle
   */
  async createRole(roleData: { name: string; description?: string; level?: number }) {
    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        label: roleData.name,
        description: roleData.description,
        level: roleData.level || 0,
      },
    })

    return {
      success: true,
      data: role,
      statusCode: 201,
      message: 'Role created successfully',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Met à jour un rôle
   */
  async updateRole(
    roleId: string,
    roleData: { name?: string; description?: string; level?: number; isActive?: boolean }
  ) {
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(roleData.name && { name: roleData.name, label: roleData.name }),
        ...(roleData.description !== undefined && { description: roleData.description }),
        ...(roleData.level !== undefined && { level: roleData.level }),
        ...(roleData.isActive !== undefined && { isActive: roleData.isActive }),
      },
    })

    return {
      success: true,
      data: role,
      statusCode: 200,
      message: 'Role updated successfully',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Supprime un rôle
   */
  async deleteRole(roleId: string) {
    await this.prisma.role.delete({
      where: { id: roleId },
    })

    return {
      success: true,
      data: null,
      statusCode: 200,
      message: 'Role deleted successfully',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Assigne des permissions à un rôle
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    // Supprimer les permissions existantes
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    })

    // Créer les nouvelles associations
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    })

    return {
      success: true,
      data: { roleId, permissionIds },
      statusCode: 200,
      message: 'Permissions assigned successfully',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Révoque des permissions d'un rôle
   */
  async revokePermissionsFromRole(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    })

    return {
      success: true,
      data: { roleId, permissionIds },
      statusCode: 200,
      message: 'Permissions revoked successfully',
      timestamp: new Date().toISOString(),
    }
  }
}
