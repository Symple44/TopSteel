import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Role, RolePermission, UserRole } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'


// Types déjà définis dans le service

export interface CreateRoleDto {
  name: string
  description: string
  isActive?: boolean
  permissions?: {
    permissionId: string
  }[]
}

export interface UpdateRoleDto {
  name?: string
  description?: string
  isActive?: boolean
}

export interface RoleWithStats {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  isActive: boolean
  userCount: number
  moduleCount: number
  permissionCount: number
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== GESTION DES RÔLES =====

  async findAllRoles(includePermissions: boolean = false): Promise<RoleWithStats[]> {
    // Fetch all roles with optional permissions
    const roles = await this.prisma.role.findMany({
      include: includePermissions
        ? {
            permissions: true,
          }
        : undefined,
    })

    // Calculer les statistiques pour chaque rôle
    const rolesWithStats = await Promise.all(
      roles.map(async (role) => {
        const [userCount, permissionCount] = await Promise.all([
          this.prisma.userRole.count({ where: { roleId: role.id } }),
          this.prisma.rolePermission.count({ where: { roleId: role.id } }),
        ])
        const moduleCount = 0 // Modules table doesn't exist in auth DB

        return {
          id: role.id,
          name: role.name,
          description: role.description || '',
          isSystemRole: role.isSystem,
          isActive: role.isActive,
          userCount,
          moduleCount,
          permissionCount,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        }
      })
    )

    return rolesWithStats
  }

  async findRoleById(id: string, includePermissions: boolean = false): Promise<Role> {
    // Vérifier si id est un UUID ou un nom
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    // Build where clause based on ID type
    const where = isUuid ? { id } : { name: id }

    // Fetch role with optional permissions
    const role = await this.prisma.role.findFirst({
      where,
      include: includePermissions
        ? {
            permissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
    })

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID/nom ${id} non trouvé`)
    }

    return role
  }

  async createRole(createRoleDto: CreateRoleDto, createdBy: string): Promise<Role> {
    // Vérifier l'unicité du nom
    const existingRole = await this.prisma.role.findFirst({
      where: { name: createRoleDto.name },
    })

    if (existingRole) {
      throw new ConflictException(`Un rôle avec le nom "${createRoleDto.name}" existe déjà`)
    }

    // Créer le rôle avec Prisma
    const savedRole = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        isSystem: false,
        isActive: createRoleDto.isActive ?? true,
        level: 0,
        label: createRoleDto.name,
      },
    })

    // Ajouter les permissions si spécifiées
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      await this.updateRolePermissions(savedRole.id, createRoleDto.permissions, createdBy)
    }

    return savedRole
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto, _updatedBy: string): Promise<Role> {
    const role = await this.findRoleById(id)

    if (role.isSystem) {
      throw new ForbiddenException('Impossible de modifier un rôle système')
    }

    // Vérifier l'unicité du nom si modifié
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: { name: updateRoleDto.name },
      })

      if (existingRole) {
        throw new ConflictException(`Un rôle avec le nom "${updateRoleDto.name}" existe déjà`)
      }
    }

    // Mettre à jour avec Prisma
    return await this.prisma.role.update({
      where: { id: role.id },
      data: updateRoleDto,
    })
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id)

    if (role.isSystem) {
      throw new ForbiddenException('Impossible de supprimer un rôle système')
    }

    // Vérifier s'il y a des utilisateurs assignés
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    })

    if (userCount > 0) {
      throw new ForbiddenException(
        `Impossible de supprimer le rôle "${role.name}" car il est assigné à ${userCount} utilisateur(s)`
      )
    }

    // Supprimer les permissions du rôle
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } })

    // Supprimer le rôle
    await this.prisma.role.delete({ where: { id } })
  }

  // ===== GESTION DES PERMISSIONS =====

  async getRolePermissions(roleId: string): Promise<{
    roleId: string
    modules: unknown[]
    rolePermissions: RolePermission[]
  }> {
    const role = await this.findRoleById(roleId)

    // Modules table doesn't exist in auth DB
    const modules: unknown[] = []

    // Récupérer les permissions actuelles du rôle
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    })

    return {
      roleId: role.id,
      modules,
      rolePermissions,
    }
  }

  async updateRolePermissions(
    roleId: string,
    permissions: {
      permissionId: string
    }[],
    _updatedBy: string
  ): Promise<void> {
    const role = await this.findRoleById(roleId)

    // Supprimer les permissions existantes
    await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    // Ajouter les nouvelles permissions
    if (permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: role.id,
          permissionId: p.permissionId,
          isGranted: true,
          isActive: true,
          accessLevel: 'ADMIN' as const,
        })),
      })
    }
  }

  // ===== GESTION DES UTILISATEURS =====

  async assignUserToRole(
    userId: string,
    roleId: string,
    _assignedBy: string,
    _expiresAt?: Date
  ): Promise<UserRole> {
    const role = await this.findRoleById(roleId)

    // Vérifier s'il n'y a pas déjà une assignation active
    const existingUserRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId: role.id },
    })

    if (existingUserRole) {
      throw new ConflictException("L'utilisateur a déjà ce rôle")
    }

    // Créer l'assignation avec Prisma
    return await this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    })
  }

  async removeUserFromRole(userId: string, roleId: string): Promise<void> {
    const role = await this.findRoleById(roleId)

    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId: role.id },
    })

    if (!userRole) {
      throw new NotFoundException('Assignation de rôle non trouvée')
    }

    await this.prisma.userRole.delete({ where: { id: userRole.id } })
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })

    return userRoles.map((ur) => ur.role).filter((role): role is Role => role !== null)
  }

  async getUserPermissions(userId: string): Promise<RolePermission[]> {
    const userRoles = await this.getUserRoles(userId)
    const roleIds = userRoles.map((role) => role.id)

    if (roleIds.length === 0) {
      return []
    }

    // Récupérer toutes les permissions de tous les rôles
    return await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: true },
    })
  }

  // ===== MÉTHODES UTILITAIRES =====

  async initializeSystemRoles(): Promise<void> {
    // Cette méthode peut être appelée au démarrage pour s'assurer que les rôles système existent
    const systemRoles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrateur - Accès complet' },
      { name: 'ADMIN', description: 'Administrateur - Accès administratif' },
      { name: 'MANAGER', description: 'Manager - Accès business complet' },
      { name: 'COMMERCIAL', description: 'Commercial - Clients et facturation' },
      { name: 'TECHNICIEN', description: 'Technicien - Production et stocks' },
      { name: 'OPERATEUR', description: 'Opérateur - Lecture seule production' },
    ]

    for (const roleData of systemRoles) {
      const existingRole = await this.prisma.role.findFirst({
        where: { name: roleData.name },
      })

      if (!existingRole) {
        await this.prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            isSystem: true,
            isActive: true,
            level: 0,
            label: roleData.name,
          },
        })
      }
    }
  }
}

