import { useCallback, useEffect, useState } from 'react'
import type { AccessLevel, Role, RolePermission } from '@/types/permissions'
import { callClientApi } from '@/utils/backend-api'
import { useAuth } from './use-auth'

// Cache pour éviter les appels API répétés
const permissionsCache: Map<string, RolePermission[]> = new Map()
const _roleCache: Map<string, Role> = new Map()

interface UserPermissions {
  roleId: string
  roleName: string
  permissions: RolePermission[]
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
        const permissions = data?.data?.rolePermissions || data?.data

        // Mettre en cache
        permissionsCache?.set(user.id, permissions)

        setUserPermissions({
          roleId: primaryRole,
          roleName: primaryRole,
          permissions,
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
   */
  const hasPermission = (permissionId: string): boolean => {
    if (!userPermissions) return false

    const permission = userPermissions?.permissions?.find((p) => p.permissionId === permissionId)
    return permission ? permission.isGranted : false
  }

  /**
   * Vérifier si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = (permissionIds: string[]): boolean => {
    return permissionIds?.some((id) => hasPermission(id))
  }

  /**
   * Vérifier si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (permissionIds: string[]): boolean => {
    return permissionIds?.every((id) => hasPermission(id))
  }

  /**
   * Obtenir le niveau d'accès pour une permission
   */
  const getAccessLevel = (permissionId: string): AccessLevel | null => {
    if (!userPermissions) return null

    const permission = userPermissions?.permissions?.find((p) => p.permissionId === permissionId)
    return permission ? permission.accessLevel : null
  }

  /**
   * Vérifier si l'utilisateur a au moins un niveau d'accès spécifique
   */
  const hasAccessLevel = (permissionId: string, minLevel: AccessLevel): boolean => {
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
  const canRead = (permissionId: string): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'READ')
  }

  /**
   * Vérifier si l'utilisateur peut écrire dans un module
   */
  const canWrite = (permissionId: string): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'WRITE')
  }

  /**
   * Vérifier si l'utilisateur peut supprimer dans un module
   */
  const canDelete = (permissionId: string): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'DELETE')
  }

  /**
   * Vérifier si l'utilisateur a les droits d'administration sur un module
   */
  const canAdmin = (permissionId: string): boolean => {
    return hasPermission(permissionId) && hasAccessLevel(permissionId, 'ADMIN')
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = (roleId: string): boolean => {
    if (!user) return false
    // Get user roles array (new system) or single role (legacy)
    const userRoles = user.roles || (user.role ? [user.role] : [])

    return userRoles?.some((role) => {
      const roleValue =
        typeof role === 'object' && role
          ? (role as { name?: string; role?: string }).name ||
            (role as { name?: string; role?: string }).role
          : role
      return roleValue === roleId
    })
  }

  /**
   * Vérifier si l'utilisateur a au moins un des rôles
   */
  const hasAnyRole = (roleIds: string[]): boolean => {
    return roleIds?.some((id) => hasRole(id))
  }

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
  const isSuperAdmin = (): boolean => {
    return hasRole('SUPER_ADMIN')
  }

  /**
   * Vérifier si l'utilisateur est un admin
   */
  const isAdmin = (): boolean => {
    return hasRole('ADMIN') || isSuperAdmin()
  }

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
