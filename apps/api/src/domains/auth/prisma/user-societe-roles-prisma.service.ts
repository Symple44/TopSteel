import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Permission, PermissionPrismaService } from './permission-prisma.service'
import { PermissionCalculatorService } from '../services/permission-calculator.service'

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

/**
 * UserSocieteRolesPrismaService - Phase Auth Migration
 *
 * Service de gestion des rôles utilisateur-société avec Prisma
 *
 * Fonctionnalités:
 * - Récupération des rôles d'un utilisateur dans ses sociétés
 * - Gestion des permissions par société
 * - Support rôles additionnels et restreints
 * - Calcul des permissions effectives
 */
@Injectable()
export class UserSocieteRolesPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionCalculator: PermissionCalculatorService,
    private readonly permissionService: PermissionPrismaService
  ) {}

  /**
   * Récupère les rôles et permissions d'un utilisateur dans toutes ses sociétés
   */
  async findUserRolesInSocietes(userId: string): Promise<UserSocieteRoleWithPermissions[]> {
    const userSocieteRoles = await this.prisma.userSocieteRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        societe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            parentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const result: UserSocieteRoleWithPermissions[] = []

    for (const usr of userSocieteRoles) {
      // Extraire les permissions du JSON
      const permissionsData = usr.permissions as any
      let additionalPermissions: string[] = []
      let restrictedPermissions: string[] = []

      if (permissionsData) {
        if (Array.isArray(permissionsData)) {
          additionalPermissions = permissionsData
        } else if (typeof permissionsData === 'object') {
          additionalPermissions = permissionsData.additional || []
          restrictedPermissions = permissionsData.restricted || []
        }
      }

      // Récupérer les permissions calculées pour cette société
      const userPermissions = await this.permissionService.getUserPermissions(
        userId,
        usr.societeId
      )

      // Convertir en format de permission détaillée
      const detailedPermissions = userPermissions.map((perm) => {
        const [resource, action] = perm.split('.')
        return {
          id: `${usr.societeId}:${perm}`,
          name: perm,
          resource,
          action,
          accessLevel: this.getAccessLevel(perm),
          isGranted: true,
        }
      })

      result.push({
        userId: usr.userId,
        societeId: usr.societeId,
        societe: {
          id: usr.societe.id,
          nom: usr.societe.name,
          code: usr.societe.code,
        },
        roleType: usr.role?.name || 'USER',
        isDefaultSociete: false, // Note: Pas de champ isDefaultSociete dans le schéma Prisma
        role: usr.role
          ? {
              id: usr.role.id,
              name: usr.role.name,
              parentRoleType: usr.role.parentId || undefined,
              priority: usr.role.level,
            }
          : undefined,
        permissions: detailedPermissions,
        additionalPermissions,
        restrictedPermissions,
        isDefault: false,
        isActive: usr.isActive,
      })
    }

    return result
  }

  /**
   * Récupère un rôle utilisateur-société spécifique
   */
  async findUserRoleInSociete(
    userId: string,
    societeId: string
  ): Promise<UserSocieteRoleWithPermissions | null> {
    const roles = await this.findUserRolesInSocietes(userId)
    return roles.find((r) => r.societeId === societeId) || null
  }

  /**
   * Vérifie si un utilisateur a un rôle dans une société
   */
  async hasRoleInSociete(userId: string, societeId: string): Promise<boolean> {
    const count = await this.prisma.userSocieteRole.count({
      where: {
        userId,
        societeId,
        isActive: true,
      },
    })

    return count > 0
  }

  /**
   * Récupère toutes les sociétés d'un utilisateur
   */
  async getUserSocietes(userId: string) {
    const userSocieteRoles = await this.prisma.userSocieteRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        societe: true,
        role: true,
      },
    })

    return userSocieteRoles.map((usr) => ({
      societeId: usr.societeId,
      societe: usr.societe,
      role: usr.role,
      isActive: usr.isActive,
      activatedAt: usr.activatedAt,
      createdAt: usr.createdAt,
    }))
  }

  /**
   * Ajoute un utilisateur à une société avec un rôle
   */
  async assignUserToSociete(
    userId: string,
    societeId: string,
    roleId: string,
    additionalPermissions?: string[]
  ) {
    return this.prisma.userSocieteRole.create({
      data: {
        userId,
        societeId,
        roleId,
        isActive: true,
        activatedAt: new Date(),
        permissions: additionalPermissions
          ? { additional: additionalPermissions, restricted: [] }
          : undefined,
      },
      include: {
        societe: true,
        role: true,
      },
    })
  }

  /**
   * Retire un utilisateur d'une société
   */
  async removeUserFromSociete(userId: string, societeId: string) {
    await this.prisma.userSocieteRole.updateMany({
      where: {
        userId,
        societeId,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    })
  }

  /**
   * Met à jour les permissions additionnelles d'un utilisateur dans une société
   */
  async updateAdditionalPermissions(
    userId: string,
    societeId: string,
    additionalPermissions: string[],
    restrictedPermissions?: string[]
  ) {
    const userSocieteRole = await this.prisma.userSocieteRole.findFirst({
      where: {
        userId,
        societeId,
        isActive: true,
      },
    })

    if (!userSocieteRole) {
      throw new NotFoundException(`User role not found in societe`)
    }

    return this.prisma.userSocieteRole.update({
      where: {
        id: userSocieteRole.id,
      },
      data: {
        permissions: {
          additional: additionalPermissions,
          restricted: restrictedPermissions || [],
        },
      },
    })
  }

  /**
   * Détermine le niveau d'accès d'une permission
   */
  private getAccessLevel(
    permission: Permission
  ): 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' {
    const permStr = permission.toString()

    if (permStr.includes('delete')) return 'DELETE'
    if (permStr.includes('edit') || permStr.includes('create')) return 'WRITE'
    if (permStr.includes('view')) return 'READ'
    if (permStr.includes('admin') || permStr.includes('manage')) return 'ADMIN'

    return 'READ'
  }
}
