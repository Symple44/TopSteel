'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { type Role, usePermissions } from '@/hooks/use-permissions'
import { useTranslation } from '@/lib/i18n/hooks'

interface AdminGuardProps {
  children: ReactNode
  requiredRoles?: Role[]
  requiredPermissions?: string[]
  fallbackPath?: string
  showUnauthorized?: boolean
}

/**
 * Guard pour protéger les pages admin sensibles
 * Vérifie à la fois l'authentification et les permissions spécifiques
 */
export function AdminGuard({
  children,
  requiredRoles = ['SUPER_ADMIN', 'ADMIN'] as Role[],
  requiredPermissions = [],
  fallbackPath = '/unauthorized',
  showUnauthorized = false,
}: AdminGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { hasPermission, hasAnyRole } = usePermissions()
  const { t } = useTranslation('auth')
  const router = useRouter()

  useEffect(() => {
    // L'AuthGuard se charge déjà de l'authentification de base
    // On ne vérifie que les rôles et permissions si l'utilisateur est authentifié
    if (isLoading || !isAuthenticated || !user) {
      return
    }

    // Vérifier les rôles requis
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      router.push(fallbackPath)
      return
    }

    // Vérifier les permissions requises
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission as any)
      )

      if (!hasRequiredPermissions) {
        router.push(fallbackPath)
        return
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    hasAnyRole,
    hasPermission,
    router,
    requiredRoles,
    requiredPermissions,
    fallbackPath,
  ])

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // L'AuthGuard se charge déjà de vérifier l'authentification
  // On ne fait que passer si pas authentifié (AuthGuard gère la redirection)
  if (!isAuthenticated || !user) {
    return null
  }

  // Vérification des rôles
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return showUnauthorized ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            {t('insufficientPermissions')}
          </h1>
          <p className="text-muted-foreground">{t('insufficientRoles')}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('requiredRoles')} {requiredRoles.join(', ')}
          </p>
        </div>
      </div>
    ) : null
  }

  // Vérification des permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission as any)
    )

    if (!hasRequiredPermissions) {
      return showUnauthorized ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              {t('insufficientPermissions')}
            </h1>
            <p className="text-muted-foreground">{t('insufficientPermissionsText')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('requiredPermissions')} {requiredPermissions.join(', ')}
            </p>
          </div>
        </div>
      ) : null
    }
  }

  // Si tout est OK, afficher le contenu
  return <>{children}</>
}
