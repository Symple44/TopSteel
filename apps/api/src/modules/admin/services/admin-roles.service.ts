import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Role } from '../../auth/entities/role.entity'
import { RolePermission } from '../../auth/entities/role-permission.entity'
import { Permission } from '../../auth/entities/permission.entity'

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role, 'auth')
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(RolePermission, 'auth')
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    @InjectRepository(Permission, 'auth')
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  async getRolePermissions(roleId: string) {
    try {
      console.log(`🔍 Looking for role: ${roleId}`)
      console.log(`🔍 Repository metadata:`, this.rolesRepository.metadata.tableName)
      
      // Try a simple count first to test connection
      const count = await this.rolesRepository.count()
      console.log(`📊 Total roles count: ${count}`)
      
      // D'abord chercher par nom (colonne 'nom' dans la DB)
      let role = await this.rolesRepository.findOne({
        where: { name: roleId }
      })
      
      // Si pas trouvé et que roleId ressemble à un UUID, chercher par ID
      if (!role && roleId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        role = await this.rolesRepository.findOne({
          where: { id: roleId }
        })
      }

      if (!role) {
        console.log(`❌ Role '${roleId}' not found`)
        throw new NotFoundException(`Role '${roleId}' not found`)
      }

      console.log(`✅ Found role: ${role.name} (${role.id})`)

      const rolePermissions = await this.rolePermissionsRepository.find({
        where: { roleId: role.id },
        relations: ['permission']
      })

      console.log(`📋 Found ${rolePermissions.length} permissions for role ${role.name}`)

      const permissions = rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        moduleId: rp.permission.moduleId,
        action: rp.permission.action
      }))

      return {
        success: true,
        data: {
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive
          },
          rolePermissions: permissions
        },
        statusCode: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`💥 Error in getRolePermissions for role ${roleId}:`, error)
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new Error(`Failed to get permissions for role ${roleId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAllRoles() {
    const roles = await this.rolesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    })

    return {
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      })),
      statusCode: 200, 
      message: 'Success',
      timestamp: new Date().toISOString()
    }
  }
}