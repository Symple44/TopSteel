// Hooks React pour RBAC avancé
import { useMemo } from 'react'
import { AuthAdapter } from './auth-adapter'
import { useAuth } from './auth-context'
import { rbacService } from './rbac-service'
import type { AccessPolicy, ExtendedUser, Permission } from './rbac-types'
import type { User } from './auth-types'

/**
 * Type guard pour vérifier si un objet est un User valide
 */
function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof (user as Record<string, unknown>).id === 'string' &&
    typeof (user as Record<string, unknown>).email === 'string'
  )
}

/**
 * Helper pour convertir User vers ExtendedUser
 */
function useExtendedUser(): ExtendedUser | null {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return null

    // Si c'est déjà un ExtendedUser, le retourner tel quel
    if ('societeRoles' in user) {
      return user as ExtendedUser
    }

    // Sinon, utiliser l'adaptateur pour convertir
    if (!isValidUser(user)) {
      return null
    }
    return AuthAdapter?.toExtendedUser(user)
  }, [user])
}

/**
 * Hook pour vérifier si l'utilisateur a une permission spécifique
 */
export function usePermission(permissionCode: string): boolean {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company) return false
    return rbacService?.hasPermission(extendedUser, company, permissionCode)
  }, [extendedUser, company, permissionCode])
}

/**
 * Hook pour vérifier si l'utilisateur a toutes les permissions requises
 */
export function usePermissions(permissionCodes: string[], mode: 'ALL' | 'ANY' = 'ALL'): boolean {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company || permissionCodes.length === 0) return false

    if (mode === 'ALL') {
      return rbacService?.hasAllPermissions(extendedUser, company, permissionCodes)
    } else {
      return rbacService?.hasAnyPermission(extendedUser, company, permissionCodes)
    }
  }, [extendedUser, company, permissionCodes, mode])
}

/**
 * Hook pour obtenir toutes les permissions effectives de l'utilisateur
 */
export function useEffectivePermissions(): Permission[] {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company) return []
    return rbacService?.getEffectivePermissions(extendedUser, company)
  }, [extendedUser, company])
}

/**
 * Hook pour vérifier l'accès à un module
 */
export function useModuleAccess(module: string): {
  canAccess: boolean
  permissions: Permission[]
} {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company) {
      return { canAccess: false, permissions: [] }
    }

    const permissions = rbacService?.getPermissionsByModule(extendedUser, company, module)

    return {
      canAccess: permissions.length > 0,
      permissions,
    }
  }, [extendedUser, company, module])
}

/**
 * Hook pour vérifier le niveau de rôle
 */
export function useRoleLevel(): {
  level: number
  hasMinimumLevel: (minimumLevel: number) => boolean
} {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company) {
      return {
        level: 999,
        hasMinimumLevel: () => false,
      }
    }

    const level = rbacService?.getHighestRoleLevel(extendedUser, company)

    return {
      level,
      hasMinimumLevel: (minimumLevel: number) =>
        rbacService?.hasMinimumRoleLevel(extendedUser, company, minimumLevel),
    }
  }, [extendedUser, company])
}

/**
 * Hook pour vérifier l'accès selon une politique
 */
export function useAccessPolicy(policy: AccessPolicy): boolean {
  const extendedUser = useExtendedUser()
  const { company } = useAuth()

  return useMemo(() => {
    if (!extendedUser || !company) return false

    const context = {
      user: extendedUser,
      societe: company,
      currentRole:
        extendedUser?.societeRoles?.find((r) => r.societeId === company.id && r.isActive)?.role ||
        extendedUser?.defaultRole!,
      effectivePermissions: rbacService?.getEffectivePermissions(extendedUser, company),
      sessionInfo: {
        id: 'current-session', // À récupérer depuis le contexte
        ipAddress: 'unknown',
        deviceInfo: navigator.userAgent,
        lastActivity: new Date().toISOString(),
      },
    }

    return rbacService?.checkAccess(context, policy)
  }, [extendedUser, company, policy])
}

/**
 * Hook pour les actions CRUD sur une ressource spécifique
 */
export function useResourceActions(resource: string): {
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
  canImport: boolean
} {
  const canCreate = usePermission(`${resource?.toUpperCase()}_CREATE`)
  const canRead = usePermission(`${resource?.toUpperCase()}_READ`)
  const canUpdate = usePermission(`${resource?.toUpperCase()}_UPDATE`)
  const canDelete = usePermission(`${resource?.toUpperCase()}_DELETE`)
  const canExport = usePermission(`${resource?.toUpperCase()}_EXPORT`)
  const canImport = usePermission(`${resource?.toUpperCase()}_IMPORT`)

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canImport,
  }
}

/**
 * Hook pour vérifier si l'utilisateur est admin
 */
export function useIsAdmin(): boolean {
  const { hasMinimumLevel } = useRoleLevel()
  return hasMinimumLevel(2) // Niveau admin ou supérieur
}

/**
 * Hook pour vérifier si l'utilisateur est super admin
 */
export function useIsSuperAdmin(): boolean {
  const { hasMinimumLevel } = useRoleLevel()
  return hasMinimumLevel(1) // Niveau super admin
}

/**
 * Hook pour les permissions d'affichage conditionnel
 */
export function useConditionalRender() {
  return {
    /**
     * Rendu conditionnel basé sur une permission
     */
    renderIf: (permissionCode: string, component: React.ReactNode) => {
      const hasPermission = usePermission(permissionCode)
      return hasPermission ? component : null
    },

    /**
     * Rendu conditionnel basé sur plusieurs permissions
     */
    renderIfAll: (permissionCodes: string[], component: React.ReactNode) => {
      const hasPermissions = usePermissions(permissionCodes, 'ALL')
      return hasPermissions ? component : null
    },

    /**
     * Rendu conditionnel basé sur au moins une permission
     */
    renderIfAny: (permissionCodes: string[], component: React.ReactNode) => {
      const hasPermissions = usePermissions(permissionCodes, 'ANY')
      return hasPermissions ? component : null
    },

    /**
     * Rendu conditionnel basé sur le niveau de rôle
     */
    renderIfLevel: (minimumLevel: number, component: React.ReactNode) => {
      const { hasMinimumLevel } = useRoleLevel()
      return hasMinimumLevel(minimumLevel) ? component : null
    },
  }
}
