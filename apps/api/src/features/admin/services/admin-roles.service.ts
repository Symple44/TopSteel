import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import { Role } from '../../../domains/auth/core/entities/role.entity'
import { RolePermission } from '../../../domains/auth/core/entities/role-permission.entity'

// Interface for Permission entity properties
interface PermissionData {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  societeId?: string
}

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role, 'auth')
    private readonly _rolesRepository: Repository<Role>,
    @InjectRepository(RolePermission, 'auth')
    private readonly _rolePermissionsRepository: Repository<RolePermission>
  ) {}

  async getRolePermissions(roleId: string) {
    try {
      // Try a simple count first to test connection
      const _count = await this._rolesRepository.count()

      // D'abord chercher par nom (colonne 'nom' dans la DB)
      let role = await this._rolesRepository.findOne({
        where: { name: roleId },
      })

      // Si pas trouvé et que roleId ressemble à un UUID, chercher par ID
      if (
        !role &&
        roleId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ) {
        role = await this._rolesRepository.findOne({
          where: { id: roleId },
        })
      }

      if (!role) {
        throw new NotFoundException(`Role '${roleId}' not found`)
      }

      const rolePermissions = await this._rolePermissionsRepository.find({
        where: { roleId: role.id },
        relations: ['permission'],
      })

      const permissions = rolePermissions.map((rp) => {
        const permission = rp.permission as PermissionData
        return {
          id: permission.id,
          name: permission.name,
          description: permission.description,
          moduleId: permission.resource,
          action: permission.action,
        }
      })

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

  async getAllRoles() {
    const roles = await this._rolesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    })

    return {
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }
}
