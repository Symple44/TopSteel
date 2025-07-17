'use client'

import { ReactNode, ReactElement, isValidElement, cloneElement } from 'react'
import { usePermissions, type Permission } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  /** Permission(s) requise(s) pour afficher le composant */
  permission?: Permission | Permission[]
  /** Rôle(s) requis pour afficher le composant */
  roles?: string[]
  /** Enfants à afficher si les permissions sont valides */
  children: ReactNode
  /** Composant à afficher si les permissions ne sont pas valides */
  fallback?: ReactNode
  /** Mode d'affichage quand les permissions ne sont pas valides */
  mode?: 'hide' | 'disable' | 'show-fallback'
  /** Afficher un message d'erreur personnalisé */
  errorMessage?: string
  /** Classe CSS à appliquer quand désactivé */
  disabledClassName?: string
}

/**
 * Composant pour contrôler l'affichage et l'état des éléments selon les permissions
 */
export function PermissionGuard({
  permission,
  roles,
  children,
  fallback = null,
  mode = 'hide',
  errorMessage,
  disabledClassName = 'opacity-50 cursor-not-allowed'
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAnyRole } = usePermissions()

  // Vérifier les permissions
  const checkPermissions = (): boolean => {
    // Si aucune permission n'est spécifiée, autoriser l'accès
    if (!permission && !roles) {
      return true
    }

    // Vérifier les permissions
    if (permission) {
      if (Array.isArray(permission)) {
        if (!hasAnyPermission(permission)) {
          return false
        }
      } else {
        if (!hasPermission(permission)) {
          return false
        }
      }
    }

    // Vérifier les rôles
    if (roles && roles.length > 0) {
      if (!hasAnyRole(roles as any)) {
        return false
      }
    }

    return true
  }

  const hasAccess = checkPermissions()

  // Si l'utilisateur a accès, afficher le composant normalement
  if (hasAccess) {
    return <>{children}</>
  }

  // Gérer les différents modes quand l'accès est refusé
  switch (mode) {
    case 'hide':
      return <>{fallback}</>

    case 'disable':
      // Désactiver le composant en clonant l'élément avec disabled: true
      if (isValidElement(children)) {
        return cloneElement(children as ReactElement, {
          disabled: true,
          className: `${(children as ReactElement).props.className || ''} ${disabledClassName}`.trim(),
          title: errorMessage || 'Vous n\'avez pas les permissions nécessaires'
        })
      }
      return <>{children}</>

    case 'show-fallback':
      if (fallback) {
        return <>{fallback}</>
      }
      if (errorMessage) {
        return (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {errorMessage}
          </div>
        )
      }
      return (
        <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
          Accès non autorisé
        </div>
      )

    default:
      return <>{fallback}</>
  }
}

/**
 * Composant pour masquer complètement un élément si les permissions ne sont pas valides
 */
export function PermissionHide({ permission, roles, children }: {
  permission?: Permission | Permission[]
  roles?: string[]
  children: ReactNode
}) {
  return (
    <PermissionGuard
      permission={permission}
      roles={roles}
      mode="hide"
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Composant pour désactiver un élément si les permissions ne sont pas valides
 */
export function PermissionDisable({ 
  permission, 
  roles, 
  children, 
  errorMessage,
  disabledClassName 
}: {
  permission?: Permission | Permission[]
  roles?: string[]
  children: ReactNode
  errorMessage?: string
  disabledClassName?: string
}) {
  return (
    <PermissionGuard
      permission={permission}
      roles={roles}
      mode="disable"
      errorMessage={errorMessage}
      disabledClassName={disabledClassName}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Composant pour afficher un message d'erreur si les permissions ne sont pas valides
 */
export function PermissionError({ 
  permission, 
  roles, 
  children, 
  errorMessage = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité."
}: {
  permission?: Permission | Permission[]
  roles?: string[]
  children: ReactNode
  errorMessage?: string
}) {
  return (
    <PermissionGuard
      permission={permission}
      roles={roles}
      mode="show-fallback"
      errorMessage={errorMessage}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Hook pour vérifier les permissions dans les composants
 */
export function usePermissionGuard() {
  const { hasPermission, hasAnyPermission, hasAnyRole } = usePermissions()

  const checkAccess = (permission?: Permission | Permission[], roles?: string[]): boolean => {
    // Si aucune permission n'est spécifiée, autoriser l'accès
    if (!permission && !roles) {
      return true
    }

    // Vérifier les permissions
    if (permission) {
      if (Array.isArray(permission)) {
        if (!hasAnyPermission(permission)) {
          return false
        }
      } else {
        if (!hasPermission(permission)) {
          return false
        }
      }
    }

    // Vérifier les rôles
    if (roles && roles.length > 0) {
      if (!hasAnyRole(roles as any)) {
        return false
      }
    }

    return true
  }

  return { checkAccess }
}