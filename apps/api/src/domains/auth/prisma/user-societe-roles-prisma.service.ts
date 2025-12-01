import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { TopSteelLogger } from '../../../core/common/logger/structured-logger.service'
import { SocieteRoleType } from '../core/constants/roles.constants'

/**
 * UserSocieteRolesPrismaService - Gestion des rôles utilisateur-société
 *
 * Service pour gérer les associations utilisateur-société avec leurs rôles
 *
 * Fonctionnalités:
 * - Création/modification associations
 * - Gestion permissions additionnelles/restreintes
 * - Activation/désactivation rôles
 * - Statistiques et audits
 */
@Injectable()
export class UserSocieteRolesPrismaService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly logger: TopSteelLogger
  ) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Récupère tous les rôles d'un utilisateur
   */
  async getUserRoles(userId: string) {
    return this.prisma.userSocieteRole.findMany({
      where: { userId },
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
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupère le rôle d'un utilisateur dans une société spécifique
   */
  async getUserRoleInSociete(userId: string, societeId: string) {
    const role = await this.prisma.userSocieteRole.findFirst({
      where: {
        userId,
        societeId,
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
            name: true,
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundException(
        `No role found for user ${userId} in societe ${societeId}`
      )
    }

    return role
  }

  /**
   * Crée ou met à jour un rôle utilisateur-société
   */
  async upsertUserRole(
    userId: string,
    societeId: string,
    roleName: SocieteRoleType,
    options?: {
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
    }
  ) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    // Vérifier que la société existe
    const societe = await this.prisma.societe.findUnique({
      where: { id: societeId },
    })

    if (!societe) {
      throw new NotFoundException(`Societe ${societeId} not found`)
    }

    // Trouver le rôle par son nom
    const role = await this.prisma.role.findFirst({
      where: { name: roleName },
    })

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`)
    }

    // Construire l'objet permissions
    const permissions = {
      additional: options?.additionalPermissions || [],
      restricted: options?.restrictedPermissions || [],
    }

    // Créer le rôle
    return this.prisma.userSocieteRole.create({
      data: {
        userId,
        societeId,
        roleId: role.id,
        permissions: permissions as any,
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
            name: true,
          },
        },
      },
    })
  }

  /**
   * Active un rôle utilisateur-société
   */
  async activateRole(userId: string, societeId: string) {
    return this.prisma.userSocieteRole.updateMany({
      where: {
        userId,
        societeId,
      },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Désactive un rôle utilisateur-société
   */
  async deactivateRole(userId: string, societeId: string) {
    return this.prisma.userSocieteRole.updateMany({
      where: {
        userId,
        societeId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Supprime un rôle utilisateur-société
   */
  async deleteRole(userId: string, societeId: string) {
    return this.prisma.userSocieteRole.deleteMany({
      where: {
        userId,
        societeId,
      },
    })
  }

  /**
   * Liste tous les utilisateurs d'une société
   */
  async getSocieteUsers(societeId: string, options?: { activeOnly?: boolean }) {
    return this.prisma.userSocieteRole.findMany({
      where: {
        societeId,
        ...(options?.activeOnly && { isActive: true }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            role: true,
            actif: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Statistiques des rôles pour une société
   */
  async getSocieteRoleStats(societeId: string) {
    const roles = await this.prisma.userSocieteRole.findMany({
      where: {
        societeId,
        isActive: true,
      },
      include: { role: true },
    })

    const stats = roles.reduce((acc, userRole) => {
      const roleName = userRole.role.name
      acc[roleName] = (acc[roleName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: roles.length,
      byRole: stats,
    }
  }
}
