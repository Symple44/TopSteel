import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { TopSteelLogger } from '../../../core/common/logger/structured-logger.service'
import {
  GlobalUserRole,
  SocieteRoleType,
  GLOBAL_TO_SOCIETE_ROLE_MAPPING,
  SYSTEM_ADMIN_ROLES,
} from '../core/constants/roles.constants'

/**
 * UnifiedRolesPrismaService - Gestion unifiée des rôles (Global + Société)
 *
 * Service pour gérer les rôles utilisateur à deux niveaux :
 * - Rôles globaux (niveau système)
 * - Rôles société (niveau organisation)
 *
 * Fonctionnalités:
 * - Récupération rôle effectif (max entre global et société)
 * - Vérification permissions
 * - Gestion hiérarchie rôles
 */
@Injectable()
export class UnifiedRolesPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: TopSteelLogger
  ) {}

  /**
   * Récupère le rôle global d'un utilisateur
   */
  async getUserGlobalRole(userId: string): Promise<GlobalUserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    return user.role as GlobalUserRole
  }

  /**
   * Récupère le rôle d'un utilisateur dans une société
   */
  async getUserSocieteRole(userId: string, societeId: string): Promise<SocieteRoleType | null> {
    const userSocieteRole = await this.prisma.userSocieteRole.findFirst({
      where: {
        userId,
        societeId,
        isActive: true,
      },
      include: { role: true },
    })

    if (!userSocieteRole || !userSocieteRole.role) {
      return null
    }

    // Le nom du rôle correspond à SocieteRoleType
    return userSocieteRole.role.name as SocieteRoleType
  }

  /**
   * Récupère le rôle effectif (le plus élevé entre global et société)
   */
  async getEffectiveRole(userId: string, societeId: string): Promise<SocieteRoleType> {
    const globalRole = await this.getUserGlobalRole(userId)
    const societeRole = await this.getUserSocieteRole(userId, societeId)

    // Convertir le rôle global en équivalent société
    const globalAsSocieteRole = GLOBAL_TO_SOCIETE_ROLE_MAPPING[globalRole]

    // Si pas de rôle société, retourner l'équivalent du rôle global
    if (!societeRole) {
      return globalAsSocieteRole
    }

    // Retourner le rôle le plus élevé
    return this.getHigherRole(globalAsSocieteRole, societeRole)
  }

  /**
   * Vérifie si un utilisateur est admin système
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    const globalRole = await this.getUserGlobalRole(userId)
    return SYSTEM_ADMIN_ROLES.includes(globalRole)
  }

  /**
   * Vérifie si un utilisateur est admin d'une société
   */
  async isSocieteAdmin(userId: string, societeId: string): Promise<boolean> {
    const effectiveRole = await this.getEffectiveRole(userId, societeId)
    return effectiveRole === SocieteRoleType.OWNER || effectiveRole === SocieteRoleType.ADMIN
  }

  /**
   * Liste toutes les sociétés où l'utilisateur a un rôle
   */
  async getUserSocietes(userId: string) {
    return this.prisma.userSocieteRole.findMany({
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
            name: true,
          },
        },
      },
    })
  }

  /**
   * Assigne un rôle société à un utilisateur
   */
  async assignSocieteRole(
    userId: string,
    societeId: string,
    roleName: SocieteRoleType,
    assignedBy?: string
  ) {
    // Vérifier que l'utilisateur existe
    await this.getUserGlobalRole(userId)

    // Vérifier que la société existe
    const societe = await this.prisma.societe.findUnique({
      where: { id: societeId },
    })

    if (!societe) {
      throw new NotFoundException(`Societe ${societeId} not found`)
    }

    // Trouver le role par son nom
    const role = await this.prisma.role.findFirst({
      where: { name: roleName },
    })

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`)
    }

    // Créer le rôle utilisateur-société
    return this.prisma.userSocieteRole.create({
      data: {
        userId,
        societeId,
        roleId: role.id,
        isActive: true,
      },
      include: {
        role: true,
        societe: true,
      },
    })
  }

  /**
   * Révoque le rôle société d'un utilisateur
   */
  async revokeSocieteRole(userId: string, societeId: string) {
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
   * Retourne le rôle le plus élevé entre deux rôles société
   * @private
   */
  private getHigherRole(role1: SocieteRoleType, role2: SocieteRoleType): SocieteRoleType {
    const hierarchy: Record<SocieteRoleType, number> = {
      [SocieteRoleType.OWNER]: 100,
      [SocieteRoleType.ADMIN]: 90,
      [SocieteRoleType.MANAGER]: 80,
      [SocieteRoleType.COMMERCIAL]: 70,
      [SocieteRoleType.COMPTABLE]: 60,
      [SocieteRoleType.TECHNICIEN]: 50,
      [SocieteRoleType.OPERATEUR]: 40,
      [SocieteRoleType.USER]: 30,
      [SocieteRoleType.GUEST]: 20,
      [SocieteRoleType.VIEWER]: 10,
    }

    return hierarchy[role1] >= hierarchy[role2] ? role1 : role2
  }
}
