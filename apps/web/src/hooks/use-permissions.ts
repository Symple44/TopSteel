import { useCallback, useEffect, useState } from 'react'
import type { AccessLevel, Role as RoleType, RolePermission } from '../types/permissions'
import { callClientApi } from '../utils/backend-api'
import { useAuth } from './use-auth'

// Types de permission sous forme de string literals (compatibilité avec les guards)
export type Permission =
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_ASSIGN_ROLES'
  | 'CLIENT_VIEW'
  | 'CLIENT_CREATE'
  | 'CLIENT_UPDATE'
  | 'CLIENT_DELETE'
  | 'CLIENT_EXPORT'
  | 'PROJECT_VIEW'
  | 'PROJECT_CREATE'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'PROJECT_ASSIGN'
  | 'BILLING_VIEW'
  | 'BILLING_CREATE'
  | 'BILLING_UPDATE'
  | 'BILLING_DELETE'
  | 'BILLING_VALIDATE'
  | 'PRODUCTION_VIEW'
  | 'PRODUCTION_CREATE'
  | 'PRODUCTION_UPDATE'
  | 'PRODUCTION_DELETE'
  | 'STOCK_VIEW'
  | 'STOCK_CREATE'
  | 'STOCK_UPDATE'
  | 'STOCK_DELETE'
  | 'NOTIFICATION_VIEW'
  | 'NOTIFICATION_RULES'
  | 'NOTIFICATION_ADMIN'
  | 'NOTIFICATION_SETTINGS'
  | 'ROLE_VIEW'
  | 'ROLE_CREATE'
  | 'ROLE_UPDATE'
  | 'ROLE_DELETE'
  | 'ROLE_ASSIGN_PERMISSIONS'
  | 'SYSTEM_VIEW'
  | 'SYSTEM_UPDATE'
  | 'SYSTEM_ADMIN'
  | 'SYSTEM_SETTINGS'
  | 'SYSTEM_LOGS'
  | 'SYSTEM_BACKUP'
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'
  | string // Permet d'autres permissions dynamiques

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'COMMERCIAL'
  | 'TECHNICIEN'
  | 'COMPTABLE'
  | 'OPERATEUR'
  | 'DEVISEUR'
  | 'VIEWER'
  | string // Permet d'autres rôles dynamiques

// Re-export le type Role complet pour l'admin
export type { RoleType as RoleDetails }

// Cache pour éviter les appels API répétés
const permissionsCache: Map<string, RolePermission[]> = new Map()
const _roleCache: Map<string, RoleType> = new Map()

// Type pour la réponse API des permissions
interface ApiPermission {
  id: string
  name: string // Format: "users.view", "orders.approve", etc.
  label: string
  module: string
  action: string
}

/**
 * Convertit un nom de permission du format frontend (USER_VIEW) au format API (users.view)
 */
function toApiPermissionFormat(permission: string): string {
  // USER_VIEW -> users.view
  // CLIENT_CREATE -> client.create
  const parts = permission.toLowerCase().split('_')
  if (parts.length >= 2) {
    const module = parts[0]
    const action = parts.slice(1).join('_')
    return `${module}.${action}`
  }
  return permission.toLowerCase()
}

/**
 * Convertit un nom de permission du format API (users.view) au format frontend (USER_VIEW)
 */
function toFrontendPermissionFormat(permission: string): string {
  // users.view -> USER_VIEW
  // orders.approve -> ORDERS_APPROVE
  return permission.replace('.', '_').toUpperCase()
}

interface UserPermissions {
  roleId: string
  roleName: string
  permissions: RolePermission[]
  // Permissions brutes de l'API pour la vérification par nom
  apiPermissions: ApiPermission[]
}

/**
 * Hook pour gérer les permissions dynamiques basées sur les rôles
 */
export function usePermissions() {
  const { user, tokens } = useAuth()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserPermissions = useCallback(async () => {
    if (!user || !tokens?.accessToken) return

    try {
      // Utiliser le cache si disponible
      const cached = permissionsCache?.get(user.id)
      // Get primary role for API call (using first role or legacy single role)
      const userRoles = user.roles || (user.role ? [user.role] : [])
      const primaryRole =
        userRoles?.length > 0
          ? typeof userRoles?.[0] === 'object'
            ? userRoles?.[0]?.name || userRoles?.[0]?.role
            : userRoles?.[0]
          : ''

      if (cached) {
        setUserPermissions({
          roleId: primaryRole,
          roleName: primaryRole,
          permissions: cached,
          apiPermissions: [], // Le cache ne stocke pas les apiPermissions, mais les permissions sont déjà transformées
        })
        setLoading(false)
        return
      }

      // Charger depuis l'API backend
      const response = await callClientApi(`admin/roles/${primaryRole}/permissions`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })

      if (!response?.ok) {
        if (response?.status === 401) {
          // User not authenticated - redirecting
          // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
          if (typeof window !== 'undefined') {
            window.location.href = `/login?redirect=${encodeURIComponent(window?.location?.pathname)}`
          }
        } else {
          // Permissions API error (silenced)
        }
        return
      }

      const data = await response?.json()

      if (data?.success) {
        const apiPermissions: ApiPermission[] = data?.data || []

        // Transformer les permissions API vers le format RolePermission pour compatibilité
        const permissions: RolePermission[] = apiPermissions.map((p) => ({
          id: p.id,
          roleId: primaryRole,
          permissionId: toFrontendPermissionFormat(p.name), // users.view -> USER_VIEW
          accessLevel: 'ADMIN' as AccessLevel, // L'API ne retourne pas de niveau, on assume ADMIN si la permission existe
          isGranted: true, // Si la permission est retournée, elle est accordée
        }))

        // Mettre en cache
        permissionsCache?.set(user.id, permissions)

        setUserPermissions({
          roleId: primaryRole,
          roleName: primaryRole,
          permissions,
          apiPermissions,
        })
      }
    } catch (_error) {
      // Error loading permissions (silenced)
    } finally {
      setLoading(false)
    }
  }, [user, tokens?.accessToken])

  // Charger les permissions utilisateur
  useEffect(() => {
    if (user && tokens?.accessToken) {
      loadUserPermissions()
    } else {
      setUserPermissions(null)
      setLoading(false)
    }
  }, [user, tokens?.accessToken, loadUserPermissions])

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   * Supporte les deux formats: frontend (USER_VIEW) et API (users.view)
   */
  const hasPermission = useCallback(
    (permissionId: Permission): boolean => {
      if (!userPermissions) return false

      // 1. Chercher par permissionId direct (format frontend: USER_VIEW)
      const byPermissionId = userPermissions.permissions?.find(
        (p) => p.permissionId === permissionId
      )
      if (byPermissionId?.isGranted) return true

      // 2. Chercher dans les permissions API par nom (format: users.view)
      const apiFormat = toApiPermissionFormat(permissionId)
      const byApiName = userPermissions.apiPermissions?.find((p) => p.name === apiFormat)
      if (byApiName) return true

      // 3. Chercher par permissionId converti depuis le format API
      const frontendFormat = toFrontendPermissionFormat(apiFormat)
      const byConvertedId = userPermissions.permissions?.find(
        (p) => p.permissionId === frontendFormat
      )
      if (byConvertedId?.isGranted) return true

      return false
    },
    [userPermissions]
  )

  /**
   * Vérifier si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = useCallback(
    (permissionIds: Permission[]): boolean => {
      return permissionIds?.some((id) => hasPermission(id))
    },
    [hasPermission]
  )

  /**
   * Vérifier si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = useCallback(
    (permissionIds: Permission[]): boolean => {
      return permissionIds?.every((id) => hasPermission(id))
    },
    [hasPermission]
  )

  /**
   * Obtenir le niveau d'accès pour une permission
   */
  const getAccessLevel = (permissionId: Permission): AccessLevel | null => {
    if (!userPermissions) return null

    const permission = userPermissions?.permissions?.find((p) => p.permissionId === permissionId)
    return permission ? permission.accessLevel : null
  }

  /**
   * Vérifier si l'utilisateur a au moins un niveau d'accès spécifique
   */
  const hasAccessLevel = (permissionId: Permission, minLevel: AccessLevel): boolean => {
    const userLevel = getAccessLevel(permissionId)
    if (!userLevel) return false

    const levels: AccessLevel[] = ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN']
    const userLevelIndex = levels?.indexOf(userLevel)
    const minLevelIndex = levels?.indexOf(minLevel)

    return userLevelIndex >= minLevelIndex
  }

  /**
   * Vérifier si l'utilisateur peut lire un module
   */
  const canRead = (permissionId: Permission): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'READ')
  }

  /**
   * Vérifier si l'utilisateur peut écrire dans un module
   */
  const canWrite = (permissionId: Permission): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'WRITE')
  }

  /**
   * Vérifier si l'utilisateur peut supprimer dans un module
   */
  const canDelete = (permissionId: Permission): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'DELETE')
  }

  /**
   * Vérifier si l'utilisateur a les droits d'administration sur un module
   */
  const canAdmin = (permissionId: Permission): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'ADMIN')
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = useCallback(
    (roleId: Role): boolean => {
      if (!user) return false

      // Vérifier d'abord le rôle simple (source autoritaire depuis JWT)
      if (user.role === roleId) {
        return true
      }

      // Ensuite vérifier dans le tableau des rôles (si non vide)
      const userRoles = user.roles && user.roles.length > 0 ? user.roles : []

      return userRoles.some((role) => {
        const roleValue =
          typeof role === 'object' && role
            ? (role as { name?: string; role?: string }).name ||
              (role as { name?: string; role?: string }).role
            : role
        return roleValue === roleId
      })
    },
    [user]
  )

  /**
   * Vérifier si l'utilisateur a au moins un des rôles
   */
  const hasAnyRole = useCallback(
    (roleIds: Role[]): boolean => {
      return roleIds?.some((id) => hasRole(id))
    },
    [hasRole]
  )

  /**
   * Obtenir toutes les permissions de l'utilisateur
   */
  const getUserPermissions = (): RolePermission[] => {
    return userPermissions?.permissions || []
  }

  /**
   * Obtenir les permissions par module
   */
  const getModulePermissions = (_moduleId: string): RolePermission[] => {
    if (!userPermissions) return []
    // Pour l'instant, retourner toutes les permissions car RolePermission n'a pas de moduleId
    return userPermissions.permissions
  }

  /**
   * Vérifier si l'utilisateur peut accéder à un module
   */
  const canAccessModule = (moduleId: string): boolean => {
    const modulePermissions = getModulePermissions(moduleId)
    return modulePermissions?.some((p) => p.isGranted && p.accessLevel !== 'BLOCKED')
  }

  /**
   * Obtenir le niveau d'accès le plus élevé pour un module
   */
  const getHighestModuleAccess = (moduleId: string): AccessLevel | null => {
    const modulePermissions = getModulePermissions(moduleId)
    const grantedPermissions = modulePermissions?.filter((p) => p.isGranted)

    if (grantedPermissions?.length === 0) return null

    const levels: AccessLevel[] = ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN']
    const maxLevel = grantedPermissions?.reduce((max, p) => {
      const pLevel = levels?.indexOf(p.accessLevel)
      const maxLevel = levels?.indexOf(max)
      return pLevel > maxLevel ? p.accessLevel : max
    }, 'BLOCKED' as AccessLevel)

    return maxLevel
  }

  /**
   * Vérifier si l'utilisateur est un super admin
   */
  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('SUPER_ADMIN')
  }, [hasRole])

  /**
   * Vérifier si l'utilisateur est un admin
   */
  const isAdmin = useCallback((): boolean => {
    return hasRole('ADMIN') || hasRole('SUPER_ADMIN')
  }, [hasRole])

  /**
   * Invalider le cache des permissions
   */
  const invalidateCache = () => {
    if (user) {
      permissionsCache?.delete(user.id)
      loadUserPermissions()
    }
  }

  return {
    // État
    user,
    userPermissions,
    loading,

    // Permissions de base
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Niveaux d'accès
    getAccessLevel,
    hasAccessLevel,
    canRead,
    canWrite,
    canDelete,
    canAdmin,

    // Rôles
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isAdmin,

    // Modules
    canAccessModule,
    getModulePermissions,
    getHighestModuleAccess,

    // Utilitaires
    getUserPermissions,
    invalidateCache,
  }
}

/**
 * Hook simple pour vérifier les rôles
 */
export function useRoles() {
  const { user, hasRole, hasAnyRole, isSuperAdmin, isAdmin } = usePermissions()

  return {
    user,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isAdmin,
    userRole: user?.role,
    isManager: hasRole('MANAGER'),
    isCommercial: hasRole('COMMERCIAL'),
    isTechnicien: hasRole('TECHNICIEN'),
    isOperateur: hasRole('OPERATEUR'),
    isDeviseur: hasRole('DEVISEUR'),
  }
}

/**
 * Hook pour vérifier l'accès à un module spécifique
 */
export function useModuleAccess(moduleId: string) {
  const { canAccessModule, getModulePermissions, getHighestModuleAccess, loading } =
    usePermissions()

  return {
    canAccess: canAccessModule(moduleId),
    permissions: getModulePermissions(moduleId),
    highestAccess: getHighestModuleAccess(moduleId),
    loading,
  }
}

/**
 * Hook pour vérifier les permissions sur une action spécifique
 */
export function useActionPermission(permissionId: string) {
  const { hasPermission, getAccessLevel, canRead, canWrite, canDelete, canAdmin, loading } =
    usePermissions()

  return {
    hasPermission: hasPermission(permissionId),
    accessLevel: getAccessLevel(permissionId),
    canRead: canRead(permissionId),
    canWrite: canWrite(permissionId),
    canDelete: canDelete(permissionId),
    canAdmin: canAdmin(permissionId),
    loading,
  }
}
