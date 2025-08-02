// Composants React pour contrôle d'accès RBAC
'use client'

import React from 'react'
import { useAccessPolicy, usePermission, usePermissions, useRoleLevel } from './rbac-hooks'
import type { AccessPolicy } from './rbac-types'

// Props communes pour les composants de protection
interface BaseProtectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

// ===========================================
// PROTECTION PAR PERMISSION
// ===========================================

interface PermissionGuardProps extends BaseProtectionProps {
  permission: string
}

/**
 * Composant qui affiche son contenu uniquement si l'utilisateur a la permission
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = usePermission(permission)

  return hasPermission ? children : fallback
}

// ===========================================
// PROTECTION PAR PERMISSIONS MULTIPLES
// ===========================================

interface PermissionsGuardProps extends BaseProtectionProps {
  permissions: string[]
  mode?: 'ALL' | 'ANY'
}

/**
 * Composant qui affiche son contenu si l'utilisateur a les permissions requises
 */
export function PermissionsGuard({
  permissions,
  mode = 'ALL',
  children,
  fallback = null,
}: PermissionsGuardProps) {
  const hasPermissions = usePermissions(permissions, mode)

  return hasPermissions ? children : fallback
}

// ===========================================
// PROTECTION PAR NIVEAU DE RÔLE
// ===========================================

interface RoleLevelGuardProps extends BaseProtectionProps {
  minimumLevel: number
}

/**
 * Composant qui affiche son contenu si l'utilisateur a le niveau de rôle requis
 */
export function RoleLevelGuard({ minimumLevel, children, fallback = null }: RoleLevelGuardProps) {
  const { hasMinimumLevel } = useRoleLevel()
  const hasAccess = hasMinimumLevel(minimumLevel)

  return hasAccess ? children : fallback
}

// ===========================================
// PROTECTION PAR POLITIQUE D'ACCÈS
// ===========================================

interface PolicyGuardProps extends BaseProtectionProps {
  policy: AccessPolicy
}

/**
 * Composant qui affiche son contenu selon une politique d'accès
 */
export function PolicyGuard({ policy, children, fallback = null }: PolicyGuardProps) {
  const hasAccess = useAccessPolicy(policy)

  return hasAccess ? children : fallback
}

// ===========================================
// PROTECTION ADMIN
// ===========================================

interface AdminGuardProps extends BaseProtectionProps {}

/**
 * Composant qui affiche son contenu uniquement pour les administrateurs
 */
export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <RoleLevelGuard minimumLevel={2} fallback={fallback}>
      {children}
    </RoleLevelGuard>
  )
}

/**
 * Composant qui affiche son contenu uniquement pour les super administrateurs
 */
export function SuperAdminGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <RoleLevelGuard minimumLevel={1} fallback={fallback}>
      {children}
    </RoleLevelGuard>
  )
}

// ===========================================
// PROTECTION MODULAIRE
// ===========================================

interface ModuleGuardProps extends BaseProtectionProps {
  module: string
  actions?: string[] // Actions spécifiques dans le module
}

/**
 * Composant qui affiche son contenu si l'utilisateur peut accéder au module
 */
export function ModuleGuard({ module, actions = [], children, fallback = null }: ModuleGuardProps) {
  const permissions =
    actions.length > 0
      ? actions.map((action) => `${module.toUpperCase()}_${action.toUpperCase()}`)
      : [`${module.toUpperCase()}_READ`] // Permission minimale par défaut

  return (
    <PermissionsGuard permissions={permissions} mode="ANY" fallback={fallback}>
      {children}
    </PermissionsGuard>
  )
}

// ===========================================
// COMPOSANT DE PROTECTION COMBINÉE
// ===========================================

interface AccessGuardProps extends BaseProtectionProps {
  // Permission simple
  permission?: string
  // Permissions multiples
  permissions?: string[]
  permissionsMode?: 'ALL' | 'ANY'
  // Niveau de rôle
  minimumLevel?: number
  // Module
  module?: string
  moduleActions?: string[]
  // Politique personnalisée
  policy?: AccessPolicy
}

/**
 * Composant de protection tout-en-un avec plusieurs modes de contrôle
 */
export function AccessGuard({
  permission,
  permissions,
  permissionsMode = 'ALL',
  minimumLevel,
  module,
  moduleActions,
  policy,
  children,
  fallback = null,
}: AccessGuardProps) {
  // Vérification par permission simple
  if (permission) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        {children}
      </PermissionGuard>
    )
  }

  // Vérification par permissions multiples
  if (permissions && permissions.length > 0) {
    return (
      <PermissionsGuard permissions={permissions} mode={permissionsMode} fallback={fallback}>
        {children}
      </PermissionsGuard>
    )
  }

  // Vérification par niveau de rôle
  if (minimumLevel !== undefined) {
    return (
      <RoleLevelGuard minimumLevel={minimumLevel} fallback={fallback}>
        {children}
      </RoleLevelGuard>
    )
  }

  // Vérification par module
  if (module) {
    return (
      <ModuleGuard module={module} actions={moduleActions} fallback={fallback}>
        {children}
      </ModuleGuard>
    )
  }

  // Vérification par politique
  if (policy) {
    return (
      <PolicyGuard policy={policy} fallback={fallback}>
        {children}
      </PolicyGuard>
    )
  }

  // Aucune protection spécifiée, afficher le contenu
  return <>{children}</>
}

// ===========================================
// COMPOSANT D'AFFICHAGE CONDITIONNEL
// ===========================================

interface ConditionalRenderProps {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant d'affichage conditionnel générique
 */
export function ConditionalRender({
  condition,
  children,
  fallback = null,
}: ConditionalRenderProps) {
  return condition ? children : fallback
}

// ===========================================
// COMPOSANT DE MESSAGE D'ACCÈS REFUSÉ
// ===========================================

interface AccessDeniedProps {
  message?: string
  showReturnButton?: boolean
  onReturn?: () => void
}

/**
 * Composant d'affichage pour accès refusé
 */
export function AccessDenied({
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
  showReturnButton = true,
  onReturn,
}: AccessDeniedProps) {
  const handleReturn = () => {
    if (onReturn) {
      onReturn()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
        <p className="text-gray-600 mb-4 max-w-md">{message}</p>
        {showReturnButton && (
          <button
            onClick={handleReturn}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        )}
      </div>
    </div>
  )
}
