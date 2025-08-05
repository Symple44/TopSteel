'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n'
import { CompanyLogoWrapper } from '@/components/wrappers/company-logo-wrapper'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = '/login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex justify-center">
            <CompanyLogoWrapper 
              size="lg"
              showCompanyName={true}
              className="mb-4"
            />
          </div>
          
          {/* Spinner et texte de chargement */}
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground text-lg font-medium">
              {t('auth.verifyingAuthentication', 'Vérification de l\'authentification...')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// Ancien AuthGuard pour compatibilité (désactivé)
/*
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/hooks'
import CompanySelector from './company-selector'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackUrl?: string
}

export function AuthGuardOLD({ 
  children, 
  requiredRoles = [], 
  fallbackUrl = '/login' 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, requiresCompanySelection, company, mounted } = useAuth()
  const { t } = useTranslation('auth')
  const router = useRouter()

  useEffect(() => {
    // Don't redirect until after hydration is complete
    if (!mounted) return
    
    if (!isLoading && !isAuthenticated) {
      // Add current pathname as redirect parameter
      const currentPath = window?.location?.pathname || '/dashboard'
      const redirectUrl = currentPath === '/login' ? fallbackUrl : `${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`
      router.replace(redirectUrl)
      return
    }

    if (!isLoading && isAuthenticated && user && requiredRoles.length > 0) {
      // Vérifier les rôles si spécifiés
      const hasRequiredRole = requiredRoles.some(role => 
        user.role === role || user.permissions?.includes(role)
      )
      
      if (!hasRequiredRole) {
        // Rediriger vers une page d'erreur ou dashboard si pas les bonnes permissions
        router.replace('/dashboard')
        return
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router, fallbackUrl, mounted])

  // Afficher le loader pendant la vérification ou l'hydratation
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('verifyingAuthentication')}</p>
        </div>
      </div>
    )
  }

  // Ne pas afficher le contenu si pas authentifié
  if (!isAuthenticated || !user) {
    return null
  }

  // Afficher le sélecteur de société si nécessaire (priorité absolue)
  if (requiresCompanySelection || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <CompanySelector
            showInDialog={false}
            onCompanySelected={() => {
              // Recharger la page pour que l'AuthGuard réévalue la situation
              window.location.reload()
            }}
          />
        </div>
      </div>
    )
  }

  // Vérifier les rôles si spécifiés
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.role === role || user.permissions?.includes(role)
    )
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h1>
            <p className="text-gray-600 mb-4">{t('insufficientPermissionsText')}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('back')}
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
*/
