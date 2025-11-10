import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TopSteelLogger } from '../../../core/common/logger/structured-logger.service'
import { RedisService } from '../../../core/common/services/redis.service'
import { User } from '../../users/entities/user.entity'
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'

/**
 * Définition des permissions système
 */
export enum Permission {
  // Users & Auth
  USERS_VIEW = 'users.view',
  USERS_CREATE = 'users.create',
  USERS_EDIT = 'users.edit',
  USERS_DELETE = 'users.delete',
  USERS_MANAGE_ROLES = 'users.manage_roles',

  // Partners
  PARTNERS_VIEW = 'partners.view',
  PARTNERS_CREATE = 'partners.create',
  PARTNERS_EDIT = 'partners.edit',
  PARTNERS_DELETE = 'partners.delete',
  PARTNERS_EXPORT = 'partners.export',

  // Inventory
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_EDIT = 'inventory.edit',
  INVENTORY_DELETE = 'inventory.delete',
  INVENTORY_MANAGE_STOCK = 'inventory.manage_stock',

  // Orders
  ORDERS_VIEW = 'orders.view',
  ORDERS_CREATE = 'orders.create',
  ORDERS_EDIT = 'orders.edit',
  ORDERS_DELETE = 'orders.delete',
  ORDERS_APPROVE = 'orders.approve',
  ORDERS_SHIP = 'orders.ship',

  // Quotes
  QUOTES_VIEW = 'quotes.view',
  QUOTES_CREATE = 'quotes.create',
  QUOTES_EDIT = 'quotes.edit',
  QUOTES_DELETE = 'quotes.delete',
  QUOTES_APPROVE = 'quotes.approve',

  // Projects
  PROJECTS_VIEW = 'projects.view',
  PROJECTS_CREATE = 'projects.create',
  PROJECTS_EDIT = 'projects.edit',
  PROJECTS_DELETE = 'projects.delete',
  PROJECTS_MANAGE_TEAM = 'projects.manage_team',

  // Finance
  FINANCE_VIEW = 'finance.view',
  FINANCE_CREATE = 'finance.create',
  FINANCE_EDIT = 'finance.edit',
  FINANCE_DELETE = 'finance.delete',
  FINANCE_APPROVE = 'finance.approve',

  // Reports
  REPORTS_VIEW = 'reports.view',
  REPORTS_CREATE = 'reports.create',
  REPORTS_EXPORT = 'reports.export',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_EDIT = 'settings.edit',
  SETTINGS_MANAGE_COMPANY = 'settings.manage_company',
  SETTINGS_MANAGE_SYSTEM = 'settings.manage_system',

  // Admin
  ADMIN_SUPER = 'admin.super',
  ADMIN_COMPANY = 'admin.company',
  ADMIN_SITE = 'admin.site',
}

/**
 * Définition des rôles et leurs permissions
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission), // Toutes les permissions

  ADMIN: [
    // Users (sans super admin)
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,

    // Partners
    Permission.PARTNERS_VIEW,
    Permission.PARTNERS_CREATE,
    Permission.PARTNERS_EDIT,
    Permission.PARTNERS_DELETE,
    Permission.PARTNERS_EXPORT,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_MANAGE_STOCK,

    // Orders
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_DELETE,
    Permission.ORDERS_APPROVE,
    Permission.ORDERS_SHIP,

    // Quotes
    Permission.QUOTES_VIEW,
    Permission.QUOTES_CREATE,
    Permission.QUOTES_EDIT,
    Permission.QUOTES_DELETE,
    Permission.QUOTES_APPROVE,

    // Projects
    Permission.PROJECTS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_EDIT,
    Permission.PROJECTS_DELETE,
    Permission.PROJECTS_MANAGE_TEAM,

    // Finance
    Permission.FINANCE_VIEW,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_EDIT,
    Permission.FINANCE_DELETE,
    Permission.FINANCE_APPROVE,

    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.SETTINGS_MANAGE_COMPANY,

    // Admin
    Permission.ADMIN_COMPANY,
  ],

  MANAGER: [
    // Users (lecture seule)
    Permission.USERS_VIEW,

    // Partners
    Permission.PARTNERS_VIEW,
    Permission.PARTNERS_CREATE,
    Permission.PARTNERS_EDIT,
    Permission.PARTNERS_EXPORT,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_MANAGE_STOCK,

    // Orders
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_APPROVE,
    Permission.ORDERS_SHIP,

    // Quotes
    Permission.QUOTES_VIEW,
    Permission.QUOTES_CREATE,
    Permission.QUOTES_EDIT,
    Permission.QUOTES_APPROVE,

    // Projects
    Permission.PROJECTS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_EDIT,
    Permission.PROJECTS_MANAGE_TEAM,

    // Finance
    Permission.FINANCE_VIEW,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_EDIT,

    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
  ],

  USER: [
    // Partners (lecture seule)
    Permission.PARTNERS_VIEW,

    // Inventory (lecture seule)
    Permission.INVENTORY_VIEW,

    // Orders
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,

    // Quotes
    Permission.QUOTES_VIEW,
    Permission.QUOTES_CREATE,

    // Projects (lecture seule)
    Permission.PROJECTS_VIEW,

    // Reports (lecture seule)
    Permission.REPORTS_VIEW,
  ],

  GUEST: [
    // Lecture seule limitée
    Permission.PARTNERS_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.ORDERS_VIEW,
    Permission.QUOTES_VIEW,
  ],
}

/**
 * Service de gestion des permissions
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(UserSocieteRole, 'auth')
    private userSocieteRoleRepository: Repository<UserSocieteRole>,
    @InjectRepository(User, 'auth')
    private userRepository: Repository<User>,
    private cacheService: RedisService,
    private logger: TopSteelLogger
  ) {}

  /**
   * Récupère toutes les permissions d'un utilisateur dans une société
   */
  async getUserPermissions(userId: string, societeId?: string): Promise<Permission[]> {
    const cacheKey = `permissions:${userId}:${societeId || 'global'}`

    // Vérifier le cache
    const cachedString = await this.cacheService.get(cacheKey)
    if (cachedString) {
      try {
        return JSON.parse(cachedString) as Permission[]
      } catch {
        // Ignore cache errors and continue
      }
    }

    let permissions: Permission[] = []

    // Récupérer l'utilisateur et son rôle global
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    // Permissions du rôle global
    const globalPermissions = ROLE_PERMISSIONS[user.role] || []
    permissions.push(...globalPermissions)

    // Si une société est spécifiée, récupérer les permissions spécifiques
    if (societeId) {
      const userSocieteRole = await this.userSocieteRoleRepository.findOne({
        where: {
          userId,
          societeId,
          isActive: true,
        },
      })

      if (userSocieteRole) {
        // Permissions du rôle spécifique à la société
        const societePermissions = ROLE_PERMISSIONS[userSocieteRole.roleType] || []

        // Fusionner avec les permissions globales (prendre le plus élevé)
        const mergedPermissions = this.mergePermissions(globalPermissions, societePermissions)

        // Ajouter les permissions additionnelles
        if (userSocieteRole.additionalPermissions?.length) {
          mergedPermissions.push(
            ...userSocieteRole.additionalPermissions
              .filter((p) => Object.values(Permission).includes(p as Permission))
              .map((p) => p as Permission)
          )
        }

        // Retirer les permissions restreintes
        if (userSocieteRole.restrictedPermissions?.length) {
          permissions = mergedPermissions.filter(
            (p) => !userSocieteRole.restrictedPermissions.includes(p)
          )
        } else {
          permissions = mergedPermissions
        }
      }
    }

    // Dédupliquer les permissions
    permissions = [...new Set(permissions)]

    // Mettre en cache (5 minutes)
    await this.cacheService.set(cacheKey, JSON.stringify(permissions), 300)

    return permissions
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    societeId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, societeId)
    return permissions.includes(permission)
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: Permission[],
    societeId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, societeId)
    return requiredPermissions.every((p) => permissions.includes(p))
  }

  /**
   * Vérifie si un utilisateur a au moins une des permissions requises
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: Permission[],
    societeId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, societeId)
    return requiredPermissions.some((p) => permissions.includes(p))
  }

  /**
   * Valide qu'un utilisateur a la permission requise (ou lance une exception)
   */
  async requirePermission(
    userId: string,
    permission: Permission,
    societeId?: string
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission, societeId)

    if (!hasPermission) {
      this.logger.warn(
        `User ${userId} attempted to access resource requiring ${permission} in societe ${societeId}`
      )
      throw new ForbiddenException(`Permission denied. Required permission: ${permission}`)
    }
  }

  /**
   * Récupère les permissions par rôle
   */
  getPermissionsByRole(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Récupère tous les rôles disponibles
   */
  getAllRoles(): string[] {
    return Object.keys(ROLE_PERMISSIONS)
  }

  /**
   * Récupère toutes les permissions disponibles
   */
  getAllPermissions(): Permission[] {
    return Object.values(Permission)
  }

  /**
   * Invalide le cache des permissions d'un utilisateur
   */
  async invalidateUserPermissions(userId: string, societeId?: string): Promise<void> {
    const cacheKey = `permissions:${userId}:${societeId || 'global'}`
    await this.cacheService.del(cacheKey)

    // Invalider aussi le cache global si une société est spécifiée
    if (societeId) {
      await this.cacheService.del(`permissions:${userId}:global`)
    }
  }

  /**
   * Fusionne deux ensembles de permissions en prenant le plus élevé
   */
  private mergePermissions(permissions1: Permission[], permissions2: Permission[]): Permission[] {
    const allPermissions = [...permissions1, ...permissions2]
    return [...new Set(allPermissions)]
  }

  /**
   * Récupère un résumé des permissions d'un utilisateur
   */
  async getPermissionsSummary(userId: string, societeId?: string) {
    const permissions = await this.getUserPermissions(userId, societeId)

    const summary = {
      total: permissions.length,
      byCategory: {} as Record<string, Permission[]>,
      hasAdminAccess: false,
      canManageUsers: false,
      canManageFinance: false,
      canApproveOrders: false,
    }

    // Grouper par catégorie
    permissions.forEach((perm) => {
      const category = perm.split('.')[0]
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = []
      }
      summary.byCategory[category].push(perm)
    })

    // Indicateurs spéciaux
    summary.hasAdminAccess = permissions.some(
      (p) => p.startsWith('admin.') || p === Permission.SETTINGS_MANAGE_SYSTEM
    )
    summary.canManageUsers = permissions.includes(Permission.USERS_MANAGE_ROLES)
    summary.canManageFinance = permissions.includes(Permission.FINANCE_APPROVE)
    summary.canApproveOrders = permissions.includes(Permission.ORDERS_APPROVE)

    return summary
  }
}
