import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Prisma, Role } from '@prisma/client'

// Type helpers for Role with relations
export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true
      }
    }
  }
}>

export type RoleWithUsers = Prisma.RoleGetPayload<{
  include: {
    users: {
      include: {
        user: true
      }
    }
  }
}>

export type RoleComplete = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true
      }
    }
    users: {
      include: {
        user: true
      }
    }
    societe: true
    parent: true
    children: true
  }
}>

/**
 * RolePrismaService - Phase 6.2
 *
 * Service de gestion des rôles utilisant Prisma
 *
 * Fonctionnalités:
 * - CRUD rôles
 * - Gestion permissions
 * - Hiérarchie de rôles (parent/children)
 * - Support rôles système et société
 * - Statistiques rôles
 */
@Injectable()
export class RolePrismaService {
  private readonly logger = new Logger(RolePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ROLE CRUD OPERATIONS
  // ============================================

  /**
   * Créer un nouveau rôle
   */
  async create(data: {
    name: string
    label: string
    description?: string
    level?: number
    isSystem?: boolean
    isActive?: boolean
    societeId?: string
    parentId?: string
    metadata?: Prisma.InputJsonValue
  }): Promise<Role> {
    this.logger.log(`Creating role: ${data.name}`)

    try {
      // Vérifier si le nom existe déjà
      const existingRole = await this.prisma.role.findUnique({
        where: { name: data.name },
      })

      if (existingRole) {
        throw new ConflictException('Un rôle avec ce nom existe déjà')
      }

      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          label: data.label,
          description: data.description,
          level: data.level || 0,
          isSystem: data.isSystem || false,
          isActive: data.isActive !== undefined ? data.isActive : true,
          societeId: data.societeId,
          parentId: data.parentId,
          metadata: data.metadata,
        },
      })

      this.logger.log(`Role created successfully: ${role.id}`)
      return role
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error creating role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les rôles avec filtres
   */
  async findAllRoles(
    includeInactive = false,
    societeId?: string
  ): Promise<Role[]> {
    this.logger.debug('Finding all roles')

    try {
      const where: Prisma.RoleWhereInput = {}

      if (!includeInactive) {
        where.isActive = true
      }

      if (societeId) {
        where.OR = [
          { societeId },
          { societeId: null }, // Rôles globaux
        ]
      }

      return await this.prisma.role.findMany({
        where,
        orderBy: [
          { level: 'desc' },
          { name: 'asc' },
        ],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un rôle par ID
   */
  async findRoleById(
    id: string,
    includeRelations = false
  ): Promise<Role | RoleComplete | null> {
    this.logger.debug(`Finding role: ${id}`)

    try {
      if (includeRelations) {
        return await this.prisma.role.findUnique({
          where: { id },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: {
              include: {
                user: true,
              },
            },
            societe: true,
            parent: true,
            children: true,
          },
        })
      }

      return await this.prisma.role.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un rôle par nom
   */
  async findRoleByName(name: string): Promise<Role | null> {
    this.logger.debug(`Finding role by name: ${name}`)

    try {
      return await this.prisma.role.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding role by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un rôle
   */
  async updateRole(
    id: string,
    data: {
      name?: string
      label?: string
      description?: string
      level?: number
      isSystem?: boolean
      isActive?: boolean
      societeId?: string
      parentId?: string
      metadata?: Prisma.InputJsonValue
    }
  ): Promise<Role> {
    this.logger.log(`Updating role: ${id}`)

    try {
      // Vérifier que le rôle existe
      const existingRole = await this.findRoleById(id)
      if (!existingRole) {
        throw new NotFoundException('Rôle non trouvé')
      }

      // Protection: empêcher la modification des rôles système
      if (existingRole.isSystem && data.isSystem === false) {
        throw new ConflictException('Impossible de modifier le statut système d\'un rôle système')
      }

      // Vérifier l'unicité du nom si modifié
      if (data.name && data.name !== existingRole.name) {
        const roleWithSameName = await this.findRoleByName(data.name)
        if (roleWithSameName) {
          throw new ConflictException('Un rôle avec ce nom existe déjà')
        }
      }

      const role = await this.prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          label: data.label,
          description: data.description,
          level: data.level,
          isSystem: data.isSystem,
          isActive: data.isActive,
          societeId: data.societeId,
          parentId: data.parentId,
          metadata: data.metadata,
        },
      })

      this.logger.log(`Role updated successfully: ${id}`)
      return role
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error updating role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un rôle
   */
  async deleteRole(id: string): Promise<void> {
    this.logger.log(`Deleting role: ${id}`)

    try {
      // Vérifier que le rôle existe
      const role = await this.findRoleById(id)
      if (!role) {
        throw new NotFoundException('Rôle non trouvé')
      }

      // Protection: empêcher la suppression des rôles système
      if (role.isSystem) {
        throw new ConflictException('Impossible de supprimer un rôle système')
      }

      // Vérifier si le rôle est utilisé
      const usersCount = await this.prisma.userRole.count({
        where: { roleId: id },
      })

      if (usersCount > 0) {
        throw new ConflictException(
          `Ce rôle est assigné à ${usersCount} utilisateur(s). Impossible de le supprimer.`
        )
      }

      // Supprimer le rôle
      await this.prisma.role.delete({
        where: { id },
      })

      this.logger.log(`Role deleted successfully: ${id}`)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error deleting role: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // ROLE PERMISSIONS
  // ============================================

  /**
   * Récupérer les permissions d'un rôle
   */
  async getRolePermissions(roleId: string): Promise<RoleWithPermissions | null> {
    this.logger.debug(`Getting permissions for role: ${roleId}`)

    try {
      return await this.prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting role permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Assigner une permission à un rôle
   */
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    this.logger.log(`Assigning permission ${permissionId} to role ${roleId}`)

    try {
      // Vérifier que le rôle et la permission existent
      const role = await this.findRoleById(roleId)
      if (!role) {
        throw new NotFoundException('Rôle non trouvé')
      }

      const permission = await this.prisma.permission.findUnique({
        where: { id: permissionId },
      })
      if (!permission) {
        throw new NotFoundException('Permission non trouvée')
      }

      // Créer l'association (upsert pour éviter les doublons)
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        create: {
          roleId,
          permissionId,
        },
        update: {},
      })

      this.logger.log(`Permission assigned successfully`)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error assigning permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Révoquer une permission d'un rôle
   */
  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    this.logger.log(`Revoking permission ${permissionId} from role ${roleId}`)

    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      })

      this.logger.log(`Permission revoked successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error revoking permission: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Récupérer les statistiques des rôles
   */
  async getStats(societeId?: string): Promise<{
    total: number
    active: number
    inactive: number
    system: number
    custom: number
  }> {
    this.logger.debug('Getting role statistics')

    try {
      const where: Prisma.RoleWhereInput = societeId
        ? {
            OR: [
              { societeId },
              { societeId: null },
            ],
          }
        : {}

      const [total, active, system] = await Promise.all([
        this.prisma.role.count({ where }),
        this.prisma.role.count({ where: { ...where, isActive: true } }),
        this.prisma.role.count({ where: { ...where, isSystem: true } }),
      ])

      return {
        total,
        active,
        inactive: total - active,
        system,
        custom: total - system,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting role stats: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les utilisateurs ayant un rôle
   */
  async countUsersWithRole(roleId: string): Promise<number> {
    this.logger.debug(`Counting users with role: ${roleId}`)

    try {
      return await this.prisma.userRole.count({
        where: { roleId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting users with role: ${err.message}`, err.stack)
      throw error
    }
  }
}
