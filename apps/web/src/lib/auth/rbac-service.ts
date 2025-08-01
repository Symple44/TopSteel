// Service pour gestion RBAC avancée
import type {
  AccessContext,
  AccessPolicy,
  AuditLog,
  Company,
  ExtendedUser,
  Permission,
} from './rbac-types'

export class RBACService {
  private static instance: RBACService
  private permissionCache = new Map<string, Permission[]>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService()
    }
    return RBACService.instance
  }

  /**
   * Calcule les permissions effectives d'un utilisateur pour une société
   */
  getEffectivePermissions(user: ExtendedUser, societe: Company): Permission[] {
    const cacheKey = `${user.id}-${societe.id}`

    // Vérifier le cache
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!
    }

    // Trouver le rôle pour cette société
    const userSocieteRole = user.societeRoles.find(
      (usr) => usr.societeId === societe.id && usr.isActive
    )

    let effectivePermissions: Permission[] = []

    if (userSocieteRole) {
      // Permissions du rôle
      effectivePermissions = [...userSocieteRole.role.permissions]

      // Ajouter les permissions additionnelles
      if (userSocieteRole.additionalPermissions) {
        effectivePermissions.push(...userSocieteRole.additionalPermissions)
      }

      // Retirer les permissions explicitement refusées
      if (userSocieteRole.deniedPermissions) {
        const deniedCodes = userSocieteRole.deniedPermissions.map((p) => p.code)
        effectivePermissions = effectivePermissions.filter((p) => !deniedCodes.includes(p.code))
      }
    } else if (user.defaultRole) {
      // Utiliser le rôle par défaut
      effectivePermissions = [...user.defaultRole.permissions]
    }

    // Supprimer les doublons
    effectivePermissions = this.deduplicatePermissions(effectivePermissions)

    // Mettre en cache
    this.permissionCache.set(cacheKey, effectivePermissions)
    setTimeout(() => {
      this.permissionCache.delete(cacheKey)
    }, this.CACHE_DURATION)

    return effectivePermissions
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  hasPermission(user: ExtendedUser, societe: Company, permissionCode: string): boolean {
    const permissions = this.getEffectivePermissions(user, societe)
    return permissions.some((p) => p.code === permissionCode)
  }

  /**
   * Vérifie si l'utilisateur a toutes les permissions requises
   */
  hasAllPermissions(user: ExtendedUser, societe: Company, permissionCodes: string[]): boolean {
    const permissions = this.getEffectivePermissions(user, societe)
    const userPermissionCodes = permissions.map((p) => p.code)

    return permissionCodes.every((code) => userPermissionCodes.includes(code))
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions requises
   */
  hasAnyPermission(user: ExtendedUser, societe: Company, permissionCodes: string[]): boolean {
    const permissions = this.getEffectivePermissions(user, societe)
    const userPermissionCodes = permissions.map((p) => p.code)

    return permissionCodes.some((code) => userPermissionCodes.includes(code))
  }

  /**
   * Vérifie l'accès selon une politique
   */
  checkAccess(context: AccessContext, policy: AccessPolicy): boolean {
    const { user, societe } = context
    const { requiredPermissions, mode } = policy

    let hasAccess = false

    if (mode === 'ALL') {
      hasAccess = this.hasAllPermissions(user, societe, requiredPermissions)
    } else {
      // mode === 'ANY'
      hasAccess = this.hasAnyPermission(user, societe, requiredPermissions)
    }

    // Vérifier les conditions additionnelles
    if (hasAccess && policy.conditions) {
      hasAccess = this.checkConditions(context, policy.conditions)
    }

    return hasAccess
  }

  /**
   * Filtre les permissions par module
   */
  getPermissionsByModule(user: ExtendedUser, societe: Company, module: string): Permission[] {
    const permissions = this.getEffectivePermissions(user, societe)
    return permissions.filter((p) => p.module === module)
  }

  /**
   * Vérifie si l'utilisateur peut accéder à un module
   */
  canAccessModule(user: ExtendedUser, societe: Company, module: string): boolean {
    const modulePermissions = this.getPermissionsByModule(user, societe, module)
    return modulePermissions.length > 0
  }

  /**
   * Obtient le niveau hiérarchique le plus élevé de l'utilisateur
   */
  getHighestRoleLevel(user: ExtendedUser, societe: Company): number {
    const userSocieteRole = user.societeRoles.find(
      (usr) => usr.societeId === societe.id && usr.isActive
    )

    if (userSocieteRole) {
      return userSocieteRole.role.level
    }

    if (user.defaultRole) {
      return user.defaultRole.level
    }

    return 999 // Niveau le plus bas
  }

  /**
   * Vérifie si l'utilisateur a un niveau hiérarchique suffisant
   */
  hasMinimumRoleLevel(user: ExtendedUser, societe: Company, minimumLevel: number): boolean {
    const userLevel = this.getHighestRoleLevel(user, societe)
    return userLevel <= minimumLevel // Plus le niveau est bas, plus il est élevé hiérarchiquement
  }

  /**
   * Vérifie les conditions d'accès
   */
  private checkConditions(context: AccessContext, conditions: any[]): boolean {
    // Implémentation simplifiée - à étendre selon les besoins
    return conditions.every((condition) => {
      switch (condition.type) {
        case 'time':
          return this.checkTimeCondition(condition.rule)
        case 'ip':
          return this.checkIPCondition(context.sessionInfo.ipAddress, condition.rule)
        case 'device':
          return this.checkDeviceCondition(context.sessionInfo.deviceInfo, condition.rule)
        default:
          return true
      }
    })
  }

  private checkTimeCondition(_rule: string): boolean {
    // Exemple: "09:00-17:00" ou "weekdays"
    // Implémentation à développer selon les besoins
    return true
  }

  private checkIPCondition(_userIP: string, _rule: string): boolean {
    // Exemple: "192.168.1.0/24" ou "10.0.0.1,10.0.0.2"
    // Implémentation à développer selon les besoins
    return true
  }

  private checkDeviceCondition(_deviceInfo: string, _rule: string): boolean {
    // Exemple: "trusted_devices" ou "mobile_disabled"
    // Implémentation à développer selon les besoins
    return true
  }

  /**
   * Supprime les permissions en doublon
   */
  private deduplicatePermissions(permissions: Permission[]): Permission[] {
    const seen = new Set<string>()
    return permissions.filter((permission) => {
      if (seen.has(permission.code)) {
        return false
      }
      seen.add(permission.code)
      return true
    })
  }

  /**
   * Efface le cache des permissions
   */
  clearPermissionCache(userId?: string, societeId?: string): void {
    if (userId && societeId) {
      this.permissionCache.delete(`${userId}-${societeId}`)
    } else {
      this.permissionCache.clear()
    }
  }

  /**
   * Enregistre une action dans l'audit trail
   */
  async logAuditEvent(
    userId: string,
    societeId: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    success = true,
    errorMessage?: string
  ): Promise<void> {
    if (typeof window === 'undefined') return

    const _auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
      userId,
      societeId,
      action,
      resource,
      details,
      ipAddress: 'unknown', // À récupérer depuis le contexte
      userAgent: navigator.userAgent,
      success,
      errorMessage,
    }

    try {
    } catch (_error) {}
  }
}

// Instance singleton
export const rbacService = RBACService.getInstance()
