import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils/error.utils'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { Permission } from '../core/entities/permission.entity'
import { Role } from '../core/entities/role.entity'
import { RolePermission } from '../core/entities/role-permission.entity'
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'
import type { IPermission, IRolePermission } from '../types/entities.types'

/**
 * Structure représentant une permission calculée
 */
export interface CalculatedPermission {
  resource: string
  action: string
  level: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
  source: 'role' | 'additional' | 'system'
  scope: 'global' | 'societe' | 'site'
  isRestricted: boolean
}

/**
 * Résultat du calcul des permissions pour un utilisateur
 */
export interface UserPermissionSet {
  userId: string
  societeId: string
  siteId?: string
  globalRole: string
  societeRole: string
  permissions: Map<string, CalculatedPermission>
  additionalPermissions: string[]
  restrictedPermissions: string[]
  effectivePermissions: string[]
  isDefaultSociete: boolean
  allowedSiteIds?: string[]
  calculatedAt: Date
}

/**
 * Service de calcul des permissions effectives pour les utilisateurs
 * Prend en compte la hiérarchie rôle global -> rôle société -> permissions additionnelles/restrictions
 */
@Injectable()
export class PermissionCalculatorService {
  private readonly logger = new Logger(PermissionCalculatorService.name)
  private readonly CACHE_TTL = 300 // 5 minutes

  constructor(
    @InjectRepository(UserSocieteRole, 'auth')
    private readonly userSocieteRoleRepository: Repository<UserSocieteRole>,
    @InjectRepository(Role, 'auth')
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission, 'auth')
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission, 'auth')
    readonly _rolePermissionRepository: Repository<RolePermission>,
    private readonly cacheService: OptimizedCacheService
  ) {}

  /**
   * Calcule les permissions effectives d'un utilisateur dans une société
   */
  async calculateUserPermissions(
    userId: string,
    societeId: string,
    siteId?: string
  ): Promise<UserPermissionSet> {
    const cacheKey = `permissions:${userId}:${societeId}:${siteId || 'all'}`

    // Vérifier le cache
    const cached = await this.cacheService.getWithMetrics<UserPermissionSet>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 1. Récupérer le rôle utilisateur-société
      const userSocieteRole = await this.userSocieteRoleRepository.findOne({
        where: { userId, societeId, isActive: true },
        relations: ['user', 'role'],
      })

      if (!userSocieteRole) {
        // Pas de rôle pour cette société
        return this.createEmptyPermissionSet(userId, societeId, siteId)
      }

      // 2. Vérifier l'accès au site si spécifié
      if (siteId && !userSocieteRole.hasAccessToSite(siteId)) {
        return this.createEmptyPermissionSet(userId, societeId, siteId)
      }

      // 3. Récupérer les permissions du rôle global
      const globalRole = userSocieteRole.user?.role || 'USER'
      const globalPermissions = await this.getGlobalRolePermissions(globalRole)

      // 4. Récupérer les permissions du rôle société
      const societePermissions = await this.getSocieteRolePermissions(
        userSocieteRole.roleType,
        societeId
      )

      // 5. Fusionner les permissions
      const mergedPermissions = this.mergePermissions(
        globalPermissions,
        societePermissions,
        userSocieteRole.additionalPermissions,
        userSocieteRole.restrictedPermissions
      )

      // 6. Créer le résultat
      const result: UserPermissionSet = {
        userId,
        societeId,
        siteId,
        globalRole,
        societeRole: userSocieteRole.roleType,
        permissions: mergedPermissions,
        additionalPermissions: userSocieteRole.additionalPermissions,
        restrictedPermissions: userSocieteRole.restrictedPermissions,
        effectivePermissions: Array.from(mergedPermissions.keys()),
        isDefaultSociete: userSocieteRole.isDefaultSociete,
        allowedSiteIds: userSocieteRole.allowedSiteIds,
        calculatedAt: new Date(),
      }

      // 7. Mettre en cache
      await this.cacheService.setWithGroup(
        cacheKey,
        result,
        `user:${userId}:permissions`,
        this.CACHE_TTL
      )

      return result
    } catch (error) {
      this.logger.error(
        `Error calculating permissions for user ${userId} in societe ${societeId}: ${getErrorMessage(error)}`
      )
      return this.createEmptyPermissionSet(userId, societeId, siteId)
    }
  }

  /**
   * Récupère les permissions d'un rôle global
   */
  private async getGlobalRolePermissions(
    roleType: string
  ): Promise<Map<string, CalculatedPermission>> {
    const permissions = new Map<string, CalculatedPermission>()

    // Permissions de base selon le rôle global
    const basePermissions = this.getBasePermissionsByRole(roleType)

    for (const perm of basePermissions) {
      const key = `${perm.resource}:${perm.action}`
      permissions.set(key, {
        ...perm,
        source: 'system',
        scope: 'global',
        isRestricted: false,
      })
    }

    // Récupérer les permissions depuis la base de données si nécessaire
    const dbPermissions = await this.permissionRepository.find({
      where: {
        scope: 'system',
        isActive: true,
        societeId: undefined, // Permissions globales uniquement
      },
    })

    for (const dbPerm of dbPermissions) {
      if (this.roleHasAccessToPermission(roleType, dbPerm)) {
        const key = `${dbPerm.resource}:${dbPerm.action}`
        permissions.set(key, {
          resource: dbPerm.resource,
          action: dbPerm.action,
          level: this.getAccessLevelForRole(roleType, dbPerm.action),
          source: 'role',
          scope: 'global',
          isRestricted: false,
        })
      }
    }

    return permissions
  }

  /**
   * Récupère les permissions d'un rôle société
   */
  private async getSocieteRolePermissions(
    roleType: string,
    societeId: string
  ): Promise<Map<string, CalculatedPermission>> {
    const permissions = new Map<string, CalculatedPermission>()

    // Récupérer le rôle spécifique s'il existe
    const role = await this.roleRepository.findOne({
      where: {
        parentRoleType: roleType,
        societeId,
        isActive: true,
      },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    })

    if (role?.rolePermissions) {
      for (const rolePerm of role.rolePermissions) {
        const rp = rolePerm as IRolePermission
        const permission = rp.permission as IPermission

        if (rp.isActive && rp.isGranted && permission.isActive) {
          const key = `${permission.resource}:${permission.action}`
          permissions.set(key, {
            resource: permission.resource,
            action: permission.action,
            level: rp.accessLevel,
            source: 'role',
            scope: 'societe',
            isRestricted: false,
          })
        }
      }
    }

    // Ajouter les permissions par défaut du roleType société
    const defaultPerms = this.getDefaultSocietePermissions(roleType)
    for (const perm of defaultPerms) {
      const key = `${perm.resource}:${perm.action}`
      if (!permissions.has(key)) {
        permissions.set(key, {
          ...perm,
          source: 'role',
          scope: 'societe',
          isRestricted: false,
        })
      }
    }

    return permissions
  }

  /**
   * Fusionne les permissions globales, société, additionnelles et restrictions
   */
  private mergePermissions(
    globalPermissions: Map<string, CalculatedPermission>,
    societePermissions: Map<string, CalculatedPermission>,
    additionalPermissions: string[],
    restrictedPermissions: string[]
  ): Map<string, CalculatedPermission> {
    const merged = new Map<string, CalculatedPermission>()

    // 1. Commencer avec les permissions globales
    for (const [key, perm] of globalPermissions) {
      merged.set(key, perm)
    }

    // 2. Surcharger avec les permissions société (plus spécifiques)
    for (const [key, perm] of societePermissions) {
      const existing = merged.get(key)
      if (!existing || this.compareAccessLevels(perm.level, existing.level) > 0) {
        merged.set(key, perm)
      }
    }

    // 3. Ajouter les permissions additionnelles
    for (const permString of additionalPermissions) {
      const [resource, action] = permString.split(':')
      if (resource && action) {
        const key = `${resource}:${action}`
        merged.set(key, {
          resource,
          action,
          level: 'ADMIN', // Les permissions additionnelles donnent un accès complet
          source: 'additional',
          scope: 'societe',
          isRestricted: false,
        })
      }
    }

    // 4. Appliquer les restrictions
    for (const permString of restrictedPermissions) {
      const [resource, action] = permString.split(':')
      if (resource && action) {
        const key = `${resource}:${action}`
        const existing = merged.get(key)
        if (existing) {
          existing.isRestricted = true
          existing.level = 'BLOCKED'
        }
      }
    }

    // 5. Supprimer les permissions bloquées
    for (const [key, perm] of merged) {
      if (perm.level === 'BLOCKED' || perm.isRestricted) {
        merged.delete(key)
      }
    }

    return merged
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async hasPermission(
    userId: string,
    societeId: string,
    resource: string,
    action: string,
    requiredLevel: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' = 'READ',
    siteId?: string
  ): Promise<boolean> {
    const permissions = await this.calculateUserPermissions(userId, societeId, siteId)
    const key = `${resource}:${action}`
    const permission = permissions.permissions.get(key)

    if (!permission || permission.isRestricted) {
      return false
    }

    return this.compareAccessLevels(permission.level, requiredLevel) >= 0
  }

  /**
   * Compare deux niveaux d'accès
   * @returns -1 si level1 < level2, 0 si égaux, 1 si level1 > level2
   */
  private compareAccessLevels(
    level1: CalculatedPermission['level'],
    level2: CalculatedPermission['level']
  ): number {
    const levels = ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN']
    const index1 = levels.indexOf(level1)
    const index2 = levels.indexOf(level2)
    return index1 - index2
  }

  /**
   * Obtient les permissions de base pour un rôle
   */
  private getBasePermissionsByRole(
    roleType: string
  ): Omit<CalculatedPermission, 'source' | 'scope' | 'isRestricted'>[] {
    const basePermissions: Record<
      string,
      Omit<CalculatedPermission, 'source' | 'scope' | 'isRestricted'>[]
    > = {
      SUPER_ADMIN: [{ resource: '*', action: '*', level: 'ADMIN' }],
      ADMIN: [
        { resource: 'users', action: 'read', level: 'ADMIN' },
        { resource: 'users', action: 'write', level: 'ADMIN' },
        { resource: 'users', action: 'delete', level: 'ADMIN' },
        { resource: 'societes', action: 'read', level: 'ADMIN' },
        { resource: 'societes', action: 'write', level: 'ADMIN' },
        { resource: 'parameters', action: 'read', level: 'ADMIN' },
        { resource: 'parameters', action: 'write', level: 'ADMIN' },
      ],
      MANAGER: [
        { resource: 'users', action: 'read', level: 'READ' },
        { resource: 'users', action: 'write', level: 'WRITE' },
        { resource: 'societes', action: 'read', level: 'READ' },
        { resource: 'parameters', action: 'read', level: 'READ' },
      ],
      USER: [
        { resource: 'profile', action: 'read', level: 'READ' },
        { resource: 'profile', action: 'write', level: 'WRITE' },
      ],
      GUEST: [{ resource: 'public', action: 'read', level: 'READ' }],
    }

    return basePermissions[roleType] || basePermissions.USER
  }

  /**
   * Obtient les permissions par défaut pour un rôle société
   */
  private getDefaultSocietePermissions(
    roleType: string
  ): Omit<CalculatedPermission, 'source' | 'scope' | 'isRestricted'>[] {
    const societePermissions: Record<
      string,
      Omit<CalculatedPermission, 'source' | 'scope' | 'isRestricted'>[]
    > = {
      GESTIONNAIRE: [
        { resource: 'articles', action: 'read', level: 'ADMIN' },
        { resource: 'articles', action: 'write', level: 'ADMIN' },
        { resource: 'articles', action: 'delete', level: 'ADMIN' },
        { resource: 'inventory', action: 'read', level: 'ADMIN' },
        { resource: 'inventory', action: 'write', level: 'ADMIN' },
        { resource: 'partners', action: 'read', level: 'ADMIN' },
        { resource: 'partners', action: 'write', level: 'ADMIN' },
        { resource: 'orders', action: 'read', level: 'ADMIN' },
        { resource: 'orders', action: 'write', level: 'ADMIN' },
      ],
      FACTURIER: [
        { resource: 'factures', action: 'read', level: 'ADMIN' },
        { resource: 'factures', action: 'write', level: 'ADMIN' },
        { resource: 'factures', action: 'delete', level: 'WRITE' },
        { resource: 'partners', action: 'read', level: 'READ' },
        { resource: 'articles', action: 'read', level: 'READ' },
      ],
      SUPERVISEUR: [
        { resource: 'articles', action: 'read', level: 'READ' },
        { resource: 'inventory', action: 'read', level: 'READ' },
        { resource: 'partners', action: 'read', level: 'READ' },
        { resource: 'orders', action: 'read', level: 'READ' },
        { resource: 'reports', action: 'read', level: 'ADMIN' },
      ],
      EXPEDITEUR: [
        { resource: 'deliveries', action: 'read', level: 'ADMIN' },
        { resource: 'deliveries', action: 'write', level: 'ADMIN' },
        { resource: 'inventory', action: 'read', level: 'READ' },
        { resource: 'inventory', action: 'write', level: 'WRITE' },
        { resource: 'orders', action: 'read', level: 'READ' },
      ],
      OPERATEUR_PRODUCTION: [
        { resource: 'production', action: 'read', level: 'ADMIN' },
        { resource: 'production', action: 'write', level: 'ADMIN' },
        { resource: 'materials', action: 'read', level: 'READ' },
        { resource: 'materials', action: 'write', level: 'WRITE' },
        { resource: 'inventory', action: 'read', level: 'READ' },
      ],
      INVITE: [
        { resource: 'public', action: 'read', level: 'READ' },
        { resource: 'reports', action: 'read', level: 'READ' },
      ],
    }

    return societePermissions[roleType] || []
  }

  /**
   * Vérifie si un rôle a accès à une permission
   */
  private roleHasAccessToPermission(roleType: string, permission: Permission): boolean {
    // SUPER_ADMIN a accès à tout
    if (roleType === 'SUPER_ADMIN') {
      return true
    }

    // Logique spécifique selon le rôle et la permission
    const rolePermissionMatrix: Record<string, string[]> = {
      ADMIN: ['users', 'societes', 'parameters', 'roles', 'permissions'],
      MANAGER: ['users', 'societes', 'parameters'],
      USER: ['profile'],
      GUEST: ['public'],
    }

    const allowedResources = rolePermissionMatrix[roleType] || []
    return allowedResources.includes(permission.resource) || allowedResources.includes('*')
  }

  /**
   * Obtient le niveau d'accès pour un rôle et une action
   */
  private getAccessLevelForRole(roleType: string, action: string): CalculatedPermission['level'] {
    const roleLevelMatrix: Record<string, Record<string, CalculatedPermission['level']>> = {
      SUPER_ADMIN: {
        read: 'ADMIN',
        write: 'ADMIN',
        delete: 'ADMIN',
        admin: 'ADMIN',
      },
      ADMIN: {
        read: 'ADMIN',
        write: 'ADMIN',
        delete: 'DELETE',
        admin: 'ADMIN',
      },
      MANAGER: {
        read: 'READ',
        write: 'WRITE',
        delete: 'BLOCKED',
        admin: 'BLOCKED',
      },
      USER: {
        read: 'READ',
        write: 'WRITE',
        delete: 'BLOCKED',
        admin: 'BLOCKED',
      },
      GUEST: {
        read: 'READ',
        write: 'BLOCKED',
        delete: 'BLOCKED',
        admin: 'BLOCKED',
      },
    }

    return roleLevelMatrix[roleType]?.[action] || 'BLOCKED'
  }

  /**
   * Crée un ensemble de permissions vide
   */
  private createEmptyPermissionSet(
    userId: string,
    societeId: string,
    siteId?: string
  ): UserPermissionSet {
    return {
      userId,
      societeId,
      siteId,
      globalRole: 'GUEST',
      societeRole: 'INVITE',
      permissions: new Map(),
      additionalPermissions: [],
      restrictedPermissions: [],
      effectivePermissions: [],
      isDefaultSociete: false,
      allowedSiteIds: [],
      calculatedAt: new Date(),
    }
  }

  /**
   * Invalide le cache des permissions pour un utilisateur
   */
  async invalidateUserPermissions(userId: string, societeId?: string): Promise<void> {
    if (societeId) {
      await this.cacheService.invalidatePattern(`permissions:${userId}:${societeId}:*`)
    } else {
      await this.cacheService.invalidatePattern(`permissions:${userId}:*`)
    }
    await this.cacheService.invalidateGroup(`user:${userId}:permissions`)
  }

  /**
   * Obtient un résumé des permissions pour l'administration
   */
  async getPermissionsSummary(
    userId: string,
    societeId: string
  ): Promise<{
    totalPermissions: number
    byResource: Record<string, number>
    byLevel: Record<string, number>
    bySource: Record<string, number>
  }> {
    const permissions = await this.calculateUserPermissions(userId, societeId)

    const summary = {
      totalPermissions: permissions.permissions.size,
      byResource: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
    }

    for (const perm of permissions.permissions.values()) {
      // Par ressource
      summary.byResource[perm.resource] = (summary.byResource[perm.resource] || 0) + 1

      // Par niveau
      summary.byLevel[perm.level] = (summary.byLevel[perm.level] || 0) + 1

      // Par source
      summary.bySource[perm.source] = (summary.bySource[perm.source] || 0) + 1
    }

    return summary
  }
}
