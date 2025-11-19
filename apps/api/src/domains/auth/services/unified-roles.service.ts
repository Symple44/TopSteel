import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { User } from '../../users/entities/user.entity'
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
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'
import { PermissionCalculatorService } from './permission-calculator.service'

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

@Injectable()
export class UnifiedRolesService {
  private readonly ROLE_CACHE_TTL = 300 // 5 minutes
  private readonly USER_CACHE_TTL = 600 // 10 minutes

  constructor(
    @InjectRepository(UserSocieteRole, 'auth')
    private readonly userSocieteRoleRepository: Repository<UserSocieteRole>,
    @InjectRepository(User, 'auth')
    private readonly userRepository: Repository<User>,
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
    const userSocieteRoles = await this.userSocieteRoleRepository
      .createQueryBuilder('usr')
      .leftJoinAndSelect('usr.societe', 'societe')
      .leftJoinAndSelect('usr.role', 'role')
      .where('usr.userId = :userId', { userId })
      .andWhere('usr.isActive = :isActive', { isActive: true })
      .getMany()

    // Calculate effective permissions for each societe role
    const result = await Promise.all(
      userSocieteRoles.map((usr) => this.mapToUserSocieteInfoWithPermissions(user, usr))
    )

    // Cache with group invalidation
    await this.cacheService.setWithGroup(cacheKey, result, `user:${userId}`, this.ROLE_CACHE_TTL)

    return result
  }

  /**
   * Récupère le rôle d'un utilisateur dans une société spécifique
   */
  async getUserSocieteRole(userId: string, societeId: string): Promise<UserSocieteInfo | null> {
    const cacheKey = `user_societe_role:${userId}:${societeId}`

    // Try cache first
    const cached = await this.cacheService.getWithMetrics<UserSocieteInfo | null>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await this.getUserCached(userId)
    if (!user) {
      return null
    }

    // OPTIMIZED: Single query with joins
    const userSocieteRole = await this.userSocieteRoleRepository
      .createQueryBuilder('usr')
      .leftJoinAndSelect('usr.societe', 'societe')
      .leftJoinAndSelect('usr.role', 'role')
      .where('usr.userId = :userId', { userId })
      .andWhere('usr.societeId = :societeId', { societeId })
      .andWhere('usr.isActive = :isActive', { isActive: true })
      .getOne()

    let result: UserSocieteInfo | null = null

    if (userSocieteRole) {
      result = await this.mapToUserSocieteInfoWithPermissions(user, userSocieteRole)
    } else {
      // Pour SUPER_ADMIN, créer un rôle virtuel
      if (user.role === GlobalUserRole.SUPER_ADMIN) {
        result = await this.createVirtualSuperAdminRoleWithPermissions(user, societeId)
      }
    }

    // Cache with group invalidation
    await this.cacheService.setWithGroup(cacheKey, result, `user:${userId}`, this.ROLE_CACHE_TTL)

    return result
  }

  // OPTIMIZED: User caching helper
  private async getUserCached(userId: string): Promise<User | null> {
    const cacheKey = `user:${userId}`

    const cached = await this.cacheService.getWithMetrics<User | null>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.actif',
        'user.nom',
        'user.prenom',
        'user.acronyme',
      ])
      .where('user.id = :userId', { userId })
      .andWhere('user.deletedAt IS NULL')
      .getOne()

    if (user) {
      await this.cacheService.set(cacheKey, user, this.USER_CACHE_TTL)
    }

    return user
  }

  // Cache invalidation methods
  async invalidateUserRoleCache(userId: string): Promise<void> {
    await this.cacheService.invalidateGroup(`user:${userId}`)
  }

  async invalidateAllUserCaches(): Promise<void> {
    await this.cacheService.invalidatePattern('user_societe_role*')
    await this.cacheService.invalidatePattern('user_societe_roles*')
  }

  /**
   * Assigne un rôle à un utilisateur dans une société
   */
  async assignUserToSociete(
    userId: string,
    societeId: string,
    roleType: SocieteRoleType,
    grantedById?: string,
    options: {
      isDefault?: boolean
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
      allowedSiteIds?: string[]
      expiresAt?: Date
    } = {}
  ): Promise<UserSocieteRole> {
    // Vérifier si l'assignment existe déjà
    let userSocieteRole = await this.userSocieteRoleRepository.findOne({
      where: { userId, societeId },
    })

    if (userSocieteRole) {
      // Mettre à jour l'assignment existant
      userSocieteRole.roleType = roleType
      userSocieteRole.isActive = true
      userSocieteRole.isDefaultSociete = options.isDefault || userSocieteRole.isDefaultSociete
      userSocieteRole.additionalPermissions = options.additionalPermissions || []
      userSocieteRole.restrictedPermissions = options.restrictedPermissions || []
      userSocieteRole.allowedSiteIds = options.allowedSiteIds
      userSocieteRole.expiresAt = options.expiresAt
      userSocieteRole.grantedById = grantedById
    } else {
      // Créer un nouvel assignment
      userSocieteRole = UserSocieteRole.create(userId, societeId, roleType, grantedById)
      userSocieteRole.isDefaultSociete = options.isDefault || false
      userSocieteRole.additionalPermissions = options.additionalPermissions || []
      userSocieteRole.restrictedPermissions = options.restrictedPermissions || []
      userSocieteRole.allowedSiteIds = options.allowedSiteIds
      userSocieteRole.expiresAt = options.expiresAt
    }

    const saved = await this.userSocieteRoleRepository.save(userSocieteRole)

    // Invalidate permission cache
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)
    await this.invalidateUserRoleCache(userId)

    return saved
  }

  /**
   * Révoque l'accès d'un utilisateur à une société
   */
  async revokeUserFromSociete(userId: string, societeId: string): Promise<boolean> {
    const userSocieteRole = await this.userSocieteRoleRepository.findOne({
      where: { userId, societeId },
    })

    if (!userSocieteRole) {
      return false
    }

    userSocieteRole.deactivate()
    await this.userSocieteRoleRepository.save(userSocieteRole)

    // Invalidate permission cache
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)
    await this.invalidateUserRoleCache(userId)

    return true
  }

  /**
   * Définit une société comme société par défaut pour un utilisateur
   */
  async setDefaultSociete(userId: string, societeId: string): Promise<boolean> {
    // Retirer le statut par défaut de toutes les sociétés
    await this.userSocieteRoleRepository.update({ userId }, { isDefaultSociete: false })

    // Définir la nouvelle société par défaut
    const result = await this.userSocieteRoleRepository.update(
      { userId, societeId },
      { isDefaultSociete: true }
    )

    return result.affected ? result.affected > 0 : false
  }

  // ===== VÉRIFICATIONS ET VALIDATIONS =====

  /**
   * Vérifie si un utilisateur peut gérer un autre utilisateur dans une société
   */
  async canUserManageOtherUser(
    managerUserId: string,
    targetUserId: string,
    societeId: string
  ): Promise<boolean> {
    const managerInfo = await this.getUserSocieteRole(managerUserId, societeId)
    const targetInfo = await this.getUserSocieteRole(targetUserId, societeId)

    if (!managerInfo || !targetInfo) {
      return false
    }

    return canManageUser(
      managerInfo.globalRole,
      managerInfo.effectiveRole,
      targetInfo.globalRole,
      targetInfo.effectiveRole
    )
  }

  /**
   * Vérifie si un utilisateur a accès à l'administration système
   */
  async hasSystemAdminAccess(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    return user ? SYSTEM_ADMIN_ROLES.includes(user.role) : false
  }

  /**
   * Vérifie si un utilisateur a accès à l'administration d'une société
   */
  async hasSocieteAdminAccess(userId: string, societeId: string): Promise<boolean> {
    const userInfo = await this.getUserSocieteRole(userId, societeId)
    return userInfo ? SOCIETE_ADMIN_ROLES.includes(userInfo.effectiveRole) : false
  }

  /**
   * Vérifie si un utilisateur peut gérer d'autres utilisateurs dans une société
   */
  async canManageUsersInSociete(userId: string, societeId: string): Promise<boolean> {
    const userInfo = await this.getUserSocieteRole(userId, societeId)
    return userInfo ? USER_MANAGEMENT_ROLES.includes(userInfo.effectiveRole) : false
  }

  /**
   * Vérifie si un utilisateur a un accès en lecture seule
   */
  async hasReadOnlyAccess(userId: string, societeId: string): Promise<boolean> {
    const userInfo = await this.getUserSocieteRole(userId, societeId)
    return userInfo ? READ_ONLY_ROLES.includes(userInfo.effectiveRole) : false
  }

  /**
   * Valide qu'un assignment de rôle est cohérent
   */
  validateRoleAssignment(
    globalRole: GlobalUserRole,
    societeRole: SocieteRoleType,
    additionalPermissions: string[] = [],
    restrictedPermissions: string[] = []
  ): RoleValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Vérifier la cohérence global/société
    const expectedSocieteRole = GLOBAL_TO_SOCIETE_ROLE_MAPPING[globalRole]
    if (!isSocieteRoleHigherOrEqual(societeRole, expectedSocieteRole)) {
      warnings.push(`Le rôle société ${societeRole} est inférieur au rôle global ${globalRole}`)
    }

    // Vérifier les conflits de permissions
    const conflicts = additionalPermissions.filter((perm) => restrictedPermissions.includes(perm))
    if (conflicts.length > 0) {
      errors.push(
        `Conflit de permissions: ${conflicts.join(', ')} sont à la fois accordées et restreintes`
      )
    }

    // SUPER_ADMIN ne devrait pas avoir de restrictions
    if (globalRole === GlobalUserRole.SUPER_ADMIN && restrictedPermissions.length > 0) {
      warnings.push('SUPER_ADMIN ne devrait pas avoir de permissions restreintes')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // ===== UTILITAIRES ET HELPERS =====

  /**
   * Retourne les sociétés accessibles pour un utilisateur SUPER_ADMIN
   */
  async getSuperAdminSocietes(userId: string): Promise<UserSocieteInfo[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user || user.role !== GlobalUserRole.SUPER_ADMIN) {
      return []
    }

    // Pour SUPER_ADMIN, récupérer toutes les sociétés actives
    // (cette logique devrait être dans un service séparé, mais pour l'exemple...)
    const allSocietes = await this.userSocieteRoleRepository.query(`
      SELECT id, nom, code FROM societes WHERE status = 'ACTIVE'
    `)

    return allSocietes.map((societe: Record<string, unknown>) => ({
      userId,
      societeId: societe.id,
      globalRole: GlobalUserRole.SUPER_ADMIN,
      societeRole: SocieteRoleType.OWNER,
      effectiveRole: SocieteRoleType.OWNER,
      isDefaultSociete: false,
      isActive: true,
      permissions: [], // SUPER_ADMIN a toutes les permissions
      additionalPermissions: [],
      restrictedPermissions: [],
    }))
  }

  /**
   * Nettoie les rôles expirés
   */
  async cleanupExpiredRoles(): Promise<number> {
    const expiredRoles = await this.userSocieteRoleRepository.find({
      where: {
        isActive: true,
        expiresAt: new Date(), // TypeORM va faire la comparaison <= automatiquement
      },
    })

    let cleanedCount = 0
    for (const role of expiredRoles) {
      role.deactivate()
      role.addMetadata('deactivatedReason', 'expired')
      role.addMetadata('deactivatedAt', new Date().toISOString())
      await this.userSocieteRoleRepository.save(role)
      cleanedCount++
    }

    return cleanedCount
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Convertit une entité UserSocieteRole en UserSocieteInfo avec permissions calculées
   */
  private async mapToUserSocieteInfoWithPermissions(
    user: User,
    userSocieteRole: UserSocieteRole
  ): Promise<UserSocieteInfo> {
    const globalRole = user.role as GlobalUserRole
    const societeRole = userSocieteRole.roleType as SocieteRoleType
    const effectiveRole = getEffectiveSocieteRole(globalRole, societeRole)

    // Calculate effective permissions
    const permissionSet = await this.permissionCalculator.calculateUserPermissions(
      user.id,
      userSocieteRole.societeId
    )

    return {
      id: userSocieteRole.id,
      userId: user.id,
      societeId: userSocieteRole.societeId,
      globalRole,
      societeRole,
      effectiveRole,
      isDefaultSociete: userSocieteRole.isDefaultSociete,
      isActive: userSocieteRole.isEffectivelyActive(),
      permissions: permissionSet.effectivePermissions,
      additionalPermissions: userSocieteRole.additionalPermissions,
      restrictedPermissions: userSocieteRole.restrictedPermissions,
      allowedSiteIds: userSocieteRole.allowedSiteIds,
      grantedAt: userSocieteRole.createdAt,
      expiresAt: userSocieteRole.expiresAt,
      // OPTIMIZED: Include société details from the joined query
      societe: userSocieteRole.societe
        ? {
            id: userSocieteRole.societe.id,
            nom: userSocieteRole.societe.nom,
            code: userSocieteRole.societe.code,
            sites: userSocieteRole.societe.sites?.map((site) => ({
              id: site.id,
              nom: site.nom,
              code: site.code,
            })),
          }
        : undefined,
    }
  }

  /**
   * Crée un rôle virtuel pour SUPER_ADMIN avec permissions
   */
  private async createVirtualSuperAdminRoleWithPermissions(
    user: User,
    societeId: string
  ): Promise<UserSocieteInfo> {
    // Calculate permissions for SUPER_ADMIN
    const permissionSet = await this.permissionCalculator.calculateUserPermissions(
      user.id,
      societeId
    )

    return {
      id: `virtual-${user.id}-${societeId}`,
      userId: user.id,
      societeId,
      globalRole: GlobalUserRole.SUPER_ADMIN,
      societeRole: SocieteRoleType.OWNER,
      effectiveRole: SocieteRoleType.OWNER,
      isDefaultSociete: false,
      isActive: true,
      permissions: permissionSet.effectivePermissions,
      additionalPermissions: [],
      restrictedPermissions: [],
      grantedAt: user.createdAt,
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique dans une société
   */
  async hasPermission(
    userId: string,
    societeId: string,
    resource: string,
    action: string,
    requiredLevel: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' = 'READ'
  ): Promise<boolean> {
    return await this.permissionCalculator.hasPermission(
      userId,
      societeId,
      resource,
      action,
      requiredLevel
    )
  }

  /**
   * Récupère toutes les permissions effectives d'un utilisateur dans une société
   */
  async getUserEffectivePermissions(userId: string, societeId: string, siteId?: string) {
    return await this.permissionCalculator.calculateUserPermissions(userId, societeId, siteId)
  }

  /**
   * Récupère un résumé des permissions d'un utilisateur
   */
  async getUserPermissionsSummary(userId: string, societeId: string) {
    return await this.permissionCalculator.getPermissionsSummary(userId, societeId)
  }

  /**
   * Mise à jour en masse des permissions pour un rôle
   */
  async bulkUpdateRolePermissions(
    societeId: string,
    roleType: SocieteRoleType,
    permissions: {
      add?: string[]
      remove?: string[]
      restrict?: string[]
    }
  ): Promise<number> {
    const userRoles = await this.userSocieteRoleRepository.find({
      where: {
        societeId,
        roleType,
        isActive: true,
      },
    })

    let updatedCount = 0

    for (const userRole of userRoles) {
      let changed = false

      // Add permissions
      if (permissions.add?.length) {
        for (const perm of permissions.add) {
          if (!userRole.additionalPermissions.includes(perm)) {
            userRole.addAdditionalPermission(perm)
            changed = true
          }
        }
      }

      // Remove permissions
      if (permissions.remove?.length) {
        for (const perm of permissions.remove) {
          userRole.removeAdditionalPermission(perm)
          changed = true
        }
      }

      // Restrict permissions
      if (permissions.restrict?.length) {
        for (const perm of permissions.restrict) {
          if (!userRole.restrictedPermissions.includes(perm)) {
            userRole.addRestrictedPermission(perm)
            changed = true
          }
        }
      }

      if (changed) {
        await this.userSocieteRoleRepository.save(userRole)
        await this.permissionCalculator.invalidateUserPermissions(userRole.userId, societeId)
        updatedCount++
      }
    }

    return updatedCount
  }

  /**
   * Copie les permissions d'un utilisateur à un autre
   */
  async copyUserPermissions(
    fromUserId: string,
    toUserId: string,
    societeId: string,
    grantedById: string
  ): Promise<UserSocieteRole> {
    const fromRole = await this.userSocieteRoleRepository.findOne({
      where: { userId: fromUserId, societeId, isActive: true },
    })

    if (!fromRole) {
      throw new Error(`Source user role not found for user ${fromUserId} in societe ${societeId}`)
    }

    // Create or update target user role
    let toRole = await this.userSocieteRoleRepository.findOne({
      where: { userId: toUserId, societeId },
    })

    if (toRole) {
      toRole.roleType = fromRole.roleType
      toRole.additionalPermissions = [...fromRole.additionalPermissions]
      toRole.restrictedPermissions = [...fromRole.restrictedPermissions]
      toRole.allowedSiteIds = fromRole.allowedSiteIds ? [...fromRole.allowedSiteIds] : undefined
      toRole.grantedById = grantedById
      toRole.grantedAt = new Date()
      toRole.isActive = true
    } else {
      toRole = UserSocieteRole.create(toUserId, societeId, fromRole.roleType, grantedById)
      toRole.additionalPermissions = [...fromRole.additionalPermissions]
      toRole.restrictedPermissions = [...fromRole.restrictedPermissions]
      toRole.allowedSiteIds = fromRole.allowedSiteIds ? [...fromRole.allowedSiteIds] : undefined
    }

    const saved = await this.userSocieteRoleRepository.save(toRole)

    // Invalidate caches
    await Promise.all([
      this.permissionCalculator.invalidateUserPermissions(toUserId, societeId),
      this.invalidateUserRoleCache(toUserId),
    ])

    return saved
  }
}
import { User, UserSocieteRole } from '@prisma/client'
