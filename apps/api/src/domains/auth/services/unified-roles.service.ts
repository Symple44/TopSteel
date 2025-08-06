import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
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

export interface UserSocieteInfo {
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
    private readonly cacheService: OptimizedCacheService
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
      .withDeleted() // Include soft deleted records to handle them properly
      .leftJoinAndSelect('usr.societe', 'societe')
      .leftJoinAndSelect('usr.role', 'role')
      .where('usr.userId = :userId', { userId })
      .andWhere('usr.isActive = :isActive', { isActive: true })
      .andWhere('usr.deletedAt IS NULL') // Explicitly filter out soft deleted records
      .getMany()

    const result = userSocieteRoles.map((usr) => this.mapToUserSocieteInfo(user, usr))

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
      .withDeleted() // Include soft deleted records to handle them properly
      .leftJoinAndSelect('usr.societe', 'societe')
      .leftJoinAndSelect('usr.role', 'role')
      .where('usr.userId = :userId', { userId })
      .andWhere('usr.societeId = :societeId', { societeId })
      .andWhere('usr.isActive = :isActive', { isActive: true })
      .andWhere('usr.deletedAt IS NULL') // Explicitly filter out soft deleted records
      .getOne()

    let result: UserSocieteInfo | null = null

    if (userSocieteRole) {
      result = this.mapToUserSocieteInfo(user, userSocieteRole)
    } else {
      // Pour SUPER_ADMIN, créer un rôle virtuel
      if (user.role === GlobalUserRole.SUPER_ADMIN) {
        result = this.createVirtualSuperAdminRole(user, societeId)
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

    return await this.userSocieteRoleRepository.save(userSocieteRole)
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
   * Convertit une entité UserSocieteRole en UserSocieteInfo
   */
  private mapToUserSocieteInfo(user: User, userSocieteRole: UserSocieteRole): UserSocieteInfo {
    const globalRole = user.role as GlobalUserRole
    const societeRole = userSocieteRole.roleType as SocieteRoleType
    const effectiveRole = getEffectiveSocieteRole(globalRole, societeRole)

    return {
      userId: user.id,
      societeId: userSocieteRole.societeId,
      globalRole,
      societeRole,
      effectiveRole,
      isDefaultSociete: userSocieteRole.isDefaultSociete,
      isActive: userSocieteRole.isEffectivelyActive(),
      permissions: [], // TODO: Calculer les permissions effectives
      additionalPermissions: userSocieteRole.additionalPermissions,
      restrictedPermissions: userSocieteRole.restrictedPermissions,
      allowedSiteIds: userSocieteRole.allowedSiteIds,
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
   * Crée un rôle virtuel pour SUPER_ADMIN
   */
  private createVirtualSuperAdminRole(user: User, societeId: string): UserSocieteInfo {
    return {
      userId: user.id,
      societeId,
      globalRole: GlobalUserRole.SUPER_ADMIN,
      societeRole: SocieteRoleType.OWNER,
      effectiveRole: SocieteRoleType.OWNER,
      isDefaultSociete: false,
      isActive: true,
      permissions: [], // SUPER_ADMIN a toutes les permissions
      additionalPermissions: [],
      restrictedPermissions: [],
    }
  }
}
