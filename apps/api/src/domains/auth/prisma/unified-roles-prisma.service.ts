import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import {
  canManageUser,
  GLOBAL_TO_SOCIETE_ROLE_MAPPING,
  GlobalUserRole,
  getEffectiveSocieteRole,
  isSocieteRoleHigherOrEqual,
  READ_ONLY_ROLES,
  SOCIETE_ADMIN_ROLES,
  SocieteRoleType,
  SYSTEM_ADMIN_ROLES,
  USER_MANAGEMENT_ROLES,
} from '../core/constants/roles.constants'
import { PermissionCalculatorService } from '../services/permission-calculator.service'

export interface UserSocieteInfo {
  id: string
  userId: string
  societeId: string
  globalRole: GlobalUserRole
  societeRole: SocieteRoleType
  effectiveRole: SocieteRoleType
  isDefaultSociete: boolean
  isActive: boolean
  permissions: string[]
  additionalPermissions: string[]
  restrictedPermissions: string[]
  allowedSiteIds?: string[]
  grantedAt: Date
  expiresAt?: Date
  // OPTIMIZED: Include société details to avoid additional queries
  societe?: {
    id: string
    nom: string
    code: string
    sites?: {
      id: string
      nom: string
      code: string
    }[]
  }
}

export interface RoleValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * UnifiedRolesPrismaService - Phase Auth Migration
 *
 * Service unifié de gestion des rôles globaux et société avec Prisma
 *
 * Fonctionnalités:
 * - Récupération des rôles utilisateur-société avec cache
 * - Calcul des permissions effectives (global + société)
 * - Validation des changements de rôles
 * - Support hiérarchie de rôles
 * - Optimisation N+1 queries avec includes
 */
@Injectable()
export class UnifiedRolesPrismaService {
  private readonly ROLE_CACHE_TTL = 300 // 5 minutes
  private readonly USER_CACHE_TTL = 600 // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: OptimizedCacheService,
    private readonly permissionCalculator: PermissionCalculatorService
  ) {}

  // ===== GESTION DES RÔLES UTILISATEUR-SOCIÉTÉ =====

  /**
   * Récupère tous les rôles d'un utilisateur dans toutes les sociétés
   */
  async getUserSocieteRoles(userId: string): Promise<UserSocieteInfo[]> {
    const cacheKey = `user_societe_roles:${userId}`

    // Try cache first
    const cached = await this.cacheService.getWithMetrics<UserSocieteInfo[]>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await this.getUserCached(userId)
    if (!user) {
      return []
    }

    // OPTIMIZED: Single query with joins to avoid N+1
    const userSocieteRoles = await this.prisma.userSocieteRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        societe: {
          include: {
            sites: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        role: true,
      },
    })

    // Calculate effective permissions for each societe role
    const result = await Promise.all(
      userSocieteRoles.map(async (usr) => {
        const globalRole = user.role as GlobalUserRole
        const societeRole = (usr.role?.name || 'USER') as SocieteRoleType
        const effectiveRole = getEffectiveSocieteRole(globalRole, societeRole)

        // Extract permissions from JSON
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

        // Calculate effective permissions
        const permissions = await this.permissionCalculator.calculateUserPermissions(
          userId,
          usr.societeId,
          effectiveRole,
          additionalPermissions
        )

        return {
          id: usr.id,
          userId: usr.userId,
          societeId: usr.societeId,
          globalRole,
          societeRole,
          effectiveRole,
          isDefaultSociete: false, // Note: Pas de champ isDefaultSociete dans le schéma
          isActive: usr.isActive,
          permissions,
          additionalPermissions,
          restrictedPermissions,
          allowedSiteIds: undefined, // À implémenter si nécessaire
          grantedAt: usr.activatedAt || usr.createdAt,
          expiresAt: undefined, // Pas de champ d'expiration dans le schéma
          societe: {
            id: usr.societe.id,
            nom: usr.societe.name,
            code: usr.societe.code,
            sites: usr.societe.sites.map((site) => ({
              id: site.id,
              nom: site.name,
              code: site.code,
            })),
          },
        } as UserSocieteInfo
      })
    )

    // Cache the result
    await this.cacheService.set(cacheKey, result, this.ROLE_CACHE_TTL)

    return result
  }

  /**
   * Récupère le rôle d'un utilisateur dans une société spécifique
   */
  async getUserRoleInSociete(userId: string, societeId: string): Promise<UserSocieteInfo | null> {
    const allRoles = await this.getUserSocieteRoles(userId)
    return allRoles.find((role) => role.societeId === societeId) || null
  }

  /**
   * Vérifie si un utilisateur peut gérer un autre utilisateur
   */
  async canUserManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    const [manager, target] = await Promise.all([
      this.getUserCached(managerId),
      this.getUserCached(targetUserId),
    ])

    if (!manager || !target) {
      return false
    }

    // canManageUser expects 4 params: (managerGlobalRole, managerSocieteRole, targetGlobalRole, targetSocieteRole)
    return canManageUser(
      manager.role as GlobalUserRole,
      undefined,
      target.role as GlobalUserRole,
      undefined
    )
  }

  /**
   * Vérifie si un utilisateur a un rôle système admin
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserCached(userId)
    if (!user) return false

    return SYSTEM_ADMIN_ROLES.includes(user.role as GlobalUserRole)
  }

  /**
   * Vérifie si un utilisateur a un rôle admin de société
   */
  async isSocieteAdmin(userId: string, societeId?: string): Promise<boolean> {
    const user = await this.getUserCached(userId)
    if (!user) return false

    // Check global role first
    if (SYSTEM_ADMIN_ROLES.includes(user.role as GlobalUserRole)) {
      return true
    }

    // If societeId provided, check societe-specific role
    if (societeId) {
      const societeRole = await this.getUserRoleInSociete(userId, societeId)
      return societeRole
        ? SOCIETE_ADMIN_ROLES.includes(societeRole.effectiveRole as SocieteRoleType)
        : false
    }

    return false
  }

  /**
   * Vérifie si un utilisateur a un rôle en lecture seule
   */
  async isReadOnlyUser(userId: string): Promise<boolean> {
    const user = await this.getUserCached(userId)
    if (!user) return false

    return READ_ONLY_ROLES.includes(user.role as GlobalUserRole)
  }

  /**
   * Vérifie si un utilisateur peut gérer les utilisateurs
   */
  async canManageUsers(userId: string): Promise<boolean> {
    const user = await this.getUserCached(userId)
    if (!user) return false

    return USER_MANAGEMENT_ROLES.includes(user.role as GlobalUserRole)
  }

  /**
   * Valide un changement de rôle
   */
  async validateRoleChange(
    currentUserId: string,
    targetUserId: string,
    newRole: GlobalUserRole
  ): Promise<RoleValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    const [currentUser, targetUser] = await Promise.all([
      this.getUserCached(currentUserId),
      this.getUserCached(targetUserId),
    ])

    if (!currentUser) {
      errors.push('Current user not found')
      return { isValid: false, errors, warnings }
    }

    if (!targetUser) {
      errors.push('Target user not found')
      return { isValid: false, errors, warnings }
    }

    // Vérifier si l'utilisateur actuel peut gérer le nouvel utilisateur
    if (!canManageUser(currentUser.role as GlobalUserRole, undefined, newRole, undefined)) {
      errors.push(`You cannot assign the role ${newRole}`)
    }

    // Vérifier si l'utilisateur actuel peut gérer l'utilisateur cible
    if (
      !canManageUser(
        currentUser.role as GlobalUserRole,
        undefined,
        targetUser.role as GlobalUserRole,
        undefined
      )
    ) {
      errors.push(`You cannot manage user with role ${targetUser.role}`)
    }

    // Avertissements
    if (newRole === GlobalUserRole.SUPER_ADMIN && currentUser.role !== GlobalUserRole.SUPER_ADMIN) {
      warnings.push('Only SUPER_ADMIN can create other SUPER_ADMIN users')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Invalide le cache des rôles d'un utilisateur
   */
  async invalidateUserRolesCache(userId: string): Promise<void> {
    const cacheKey = `user_societe_roles:${userId}`
    await this.cacheService.delete(cacheKey)

    // Invalider aussi le cache utilisateur
    const userCacheKey = `user:${userId}`
    await this.cacheService.delete(userCacheKey)
  }

  /**
   * Récupère un utilisateur avec cache
   */
  private async getUserCached(userId: string) {
    const cacheKey = `user:${userId}`

    const cached = await this.cacheService.getWithMetrics<any>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
      },
    })

    if (user) {
      await this.cacheService.set(cacheKey, user, this.USER_CACHE_TTL)
    }

    return user
  }
}
