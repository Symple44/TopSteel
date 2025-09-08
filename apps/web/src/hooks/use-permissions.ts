import { useAuth } from './use-auth'

// Types pour les permissions
export type Permission =
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'CLIENT_VIEW'
  | 'CLIENT_CREATE'
  | 'CLIENT_UPDATE'
  | 'CLIENT_DELETE'
  | 'PROJECT_VIEW'
  | 'PROJECT_CREATE'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'BILLING_VIEW'
  | 'BILLING_CREATE'
  | 'BILLING_UPDATE'
  | 'BILLING_DELETE'
  | 'PRODUCTION_VIEW'
  | 'PRODUCTION_CREATE'
  | 'PRODUCTION_UPDATE'
  | 'PRODUCTION_DELETE'
  | 'STOCK_VIEW'
  | 'STOCK_CREATE'
  | 'STOCK_UPDATE'
  | 'STOCK_DELETE'
  | 'SYSTEM_ADMIN'
  | 'SYSTEM_SETTINGS'
  | 'SYSTEM_LOGS'
  | 'SYSTEM_BACKUP'
  | 'NOTIFICATION_ADMIN'
  | 'NOTIFICATION_RULES'
  | 'NOTIFICATION_SETTINGS'
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'COMMERCIAL'
  | 'TECHNICIEN'
  | 'COMPTABLE'
  | 'OPERATEUR'
  | 'VIEWER'

// Matrice des permissions par rôle
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'CLIENT_VIEW',
    'CLIENT_CREATE',
    'CLIENT_UPDATE',
    'CLIENT_DELETE',
    'PROJECT_VIEW',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'BILLING_VIEW',
    'BILLING_CREATE',
    'BILLING_UPDATE',
    'BILLING_DELETE',
    'PRODUCTION_VIEW',
    'PRODUCTION_CREATE',
    'PRODUCTION_UPDATE',
    'PRODUCTION_DELETE',
    'STOCK_VIEW',
    'STOCK_CREATE',
    'STOCK_UPDATE',
    'STOCK_DELETE',
    'SYSTEM_ADMIN',
    'SYSTEM_SETTINGS',
    'SYSTEM_LOGS',
    'SYSTEM_BACKUP',
    'NOTIFICATION_ADMIN',
    'NOTIFICATION_RULES',
    'NOTIFICATION_SETTINGS',
    'REPORT_VIEW',
    'REPORT_EXPORT',
  ],
  ADMIN: [
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'CLIENT_VIEW',
    'CLIENT_CREATE',
    'CLIENT_UPDATE',
    'CLIENT_DELETE',
    'PROJECT_VIEW',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'BILLING_VIEW',
    'BILLING_CREATE',
    'BILLING_UPDATE',
    'BILLING_DELETE',
    'PRODUCTION_VIEW',
    'PRODUCTION_CREATE',
    'PRODUCTION_UPDATE',
    'PRODUCTION_DELETE',
    'STOCK_VIEW',
    'STOCK_CREATE',
    'STOCK_UPDATE',
    'STOCK_DELETE',
    'SYSTEM_ADMIN',
    'SYSTEM_SETTINGS',
    'SYSTEM_LOGS',
    'SYSTEM_BACKUP',
    'NOTIFICATION_ADMIN',
    'NOTIFICATION_RULES',
    'NOTIFICATION_SETTINGS',
    'REPORT_VIEW',
    'REPORT_EXPORT',
  ],
  MANAGER: [
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'CLIENT_VIEW',
    'CLIENT_CREATE',
    'CLIENT_UPDATE',
    'CLIENT_DELETE',
    'PROJECT_VIEW',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'BILLING_VIEW',
    'BILLING_CREATE',
    'BILLING_UPDATE',
    'BILLING_DELETE',
    'PRODUCTION_VIEW',
    'PRODUCTION_CREATE',
    'PRODUCTION_UPDATE',
    'STOCK_VIEW',
    'STOCK_CREATE',
    'STOCK_UPDATE',
    'STOCK_DELETE',
    'NOTIFICATION_SETTINGS',
    'REPORT_VIEW',
    'REPORT_EXPORT',
  ],
  COMMERCIAL: [
    'USER_VIEW',
    'CLIENT_VIEW',
    'CLIENT_CREATE',
    'CLIENT_UPDATE',
    'PROJECT_VIEW',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'BILLING_VIEW',
    'BILLING_CREATE',
    'BILLING_UPDATE',
    'PRODUCTION_VIEW',
    'STOCK_VIEW',
    'REPORT_VIEW',
  ],
  TECHNICIEN: [
    'USER_VIEW',
    'CLIENT_VIEW',
    'PROJECT_VIEW',
    'PROJECT_UPDATE',
    'BILLING_VIEW',
    'PRODUCTION_VIEW',
    'PRODUCTION_UPDATE',
    'STOCK_VIEW',
    'STOCK_UPDATE',
    'REPORT_VIEW',
  ],
  COMPTABLE: [
    'USER_VIEW',
    'CLIENT_VIEW',
    'PROJECT_VIEW',
    'BILLING_VIEW',
    'BILLING_CREATE',
    'BILLING_UPDATE',
    'PRODUCTION_VIEW',
    'STOCK_VIEW',
    'REPORT_VIEW',
    'REPORT_EXPORT',
  ],
  OPERATEUR: [
    'USER_VIEW',
    'CLIENT_VIEW',
    'PROJECT_VIEW',
    'BILLING_VIEW',
    'PRODUCTION_VIEW',
    'PRODUCTION_UPDATE',
    'STOCK_VIEW',
    'REPORT_VIEW',
  ],
  VIEWER: [
    'USER_VIEW',
    'CLIENT_VIEW',
    'PROJECT_VIEW',
    'BILLING_VIEW',
    'PRODUCTION_VIEW',
    'STOCK_VIEW',
    'REPORT_VIEW',
  ],
}

/**
 * Hook pour gérer les permissions granulaires
 */
export function usePermissions() {
  const { user } = useAuth()

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false

    // Get user roles array (new system) or single role (legacy)
    const userRoles = (user as unknown).roles || (user.role ? [user.role] : [])

    // L'admin et super admin ont toutes les permissions
    const hasAdminRole = userRoles?.some((role: unknown) => {
      const roleValue = typeof role === 'object' ? role.name || role.role : role
      return roleValue === 'ADMIN' || roleValue === 'SUPER_ADMIN'
    })

    if (hasAdminRole) {
      return true
    }

    // Vérifier dans les permissions explicites de l'utilisateur
    if (user.permissions?.includes(permission)) {
      return true
    }

    // Vérifier dans les permissions des rôles
    for (const role of userRoles) {
      const roleValue = typeof role === 'object' ? role.name || role.role : role
      const rolePermissions = ROLE_PERMISSIONS[roleValue as Role]
      if (rolePermissions?.includes(permission)) {
        return true
      }
    }

    return false
  }

  /**
   * Vérifier si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions?.some((permission) => hasPermission(permission))
  }

  /**
   * Vérifier si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions?.every((permission) => hasPermission(permission))
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = (role: Role): boolean => {
    if (!user) return false
    // Get user roles array (new system) or single role (legacy)
    const userRoles = (user as unknown).roles || (user.role ? [user.role] : [])

    return userRoles?.some((userRole: unknown) => {
      const roleValue = typeof userRole === 'object' ? userRole.name || userRole.role : userRole
      return roleValue === role || roleValue === role?.toLowerCase()
    })
  }

  /**
   * Vérifier si l'utilisateur a au moins un des rôles
   */
  const hasAnyRole = (roles: Role[]): boolean => {
    return roles?.some((role) => hasRole(role))
  }

  /**
   * Obtenir toutes les permissions de l'utilisateur
   */
  const getUserPermissions = (): Permission[] => {
    if (!user) return []

    // Get user roles array (new system) or single role (legacy)
    const userRoles = (user as unknown).roles || (user.role ? [user.role] : [])

    // L'admin a toutes les permissions
    const hasAdminRole = userRoles?.some((role: unknown) => {
      const roleValue = typeof role === 'object' ? role.name || role.role : role
      return roleValue === 'admin' || roleValue === 'ADMIN'
    })

    if (hasAdminRole) {
      return Object.values(ROLE_PERMISSIONS).flat()
    }

    const rolePermissions: Permission[] = []
    for (const role of userRoles) {
      const roleValue = typeof role === 'object' ? role.name || role.role : role
      const permissions = ROLE_PERMISSIONS[roleValue as Role] || []
      rolePermissions?.push(...permissions)
    }
    const userPermissions = (user.permissions || []) as Permission[]

    // Combiner les permissions du rôle et les permissions explicites
    return [...new Set([...rolePermissions, ...userPermissions])]
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une page
   */
  const canAccessPage = (requiredPermissions: Permission[]): boolean => {
    if (requiredPermissions.length === 0) return true
    return hasAnyPermission(requiredPermissions)
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserPermissions,
    canAccessPage,
    user,
  }
}

/**
 * Hook pour les rôles (alias pour la compatibilité)
 */
export function useRoles() {
  const { hasRole, hasAnyRole, user } = usePermissions()

  return {
    hasRole,
    hasAnyRole,
    userRole: user?.role as Role,
    isSuperAdmin: hasRole('SUPER_ADMIN'),
    isAdmin: hasRole('ADMIN'),
    isManager: hasRole('MANAGER'),
    isCommercial: hasRole('COMMERCIAL'),
    isTechnicien: hasRole('TECHNICIEN'),
    isComptable: hasRole('COMPTABLE'),
    isOperateur: hasRole('OPERATEUR'),
    isViewer: hasRole('VIEWER'),
  }
}
