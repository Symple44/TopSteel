'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePathname, useRouter } from 'next/navigation'

interface AuthProviderProps {
  children: React.ReactNode
}

// Routes qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/support',
]

// Routes qui nécessitent une authentification mais pas de redirection immédiate
const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/settings',
]

// Routes qui redirigent automatiquement si déjà connecté
const AUTH_ROUTES = ['/login', '/register']

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, tokens, isAuthenticated, isLoading, setUser, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Fonction de redirection sécurisée
  const safeRedirect = React.useCallback((url: string) => {
    try {
      router.replace(url)
    } catch (error) {
      console.error('Redirect failed:', error)
      // Fallback: utiliser window.location si router.replace échoue
      if (typeof window !== 'undefined') {
        window.location.href = url
      }
    }
  }, [router])

  // Initialiser la session au démarrage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('topsteel-session-initialized')) {
      sessionStorage.setItem('topsteel-session-initialized', 'true')
      console.log('Session initialized on startup')
    }

    // Nettoyer le marqueur de session à la fermeture
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('topsteel-session-initialized')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Gestion des redirections basées sur l'état d'authentification
  React.useEffect(() => {
    // Ne pas faire de redirections si on est encore en train de charger
    if (typeof window === 'undefined' || isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

    // Si l'utilisateur est connecté et sur une page d'auth, rediriger vers dashboard
    if (isAuthenticated && isAuthRoute) {
      safeRedirect('/dashboard')
      return
    }

    // Pour les routes protégées, ne pas rediriger immédiatement
    // Laisser l'AuthGuard gérer l'authentification
    if (isProtectedRoute) {
      return
    }

    // Si l'utilisateur n'est pas connecté et sur une page privée, rediriger vers login
    if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
      safeRedirect('/login')
      return
    }

    // Redirection depuis la page racine uniquement si non authentifié
    if (pathname === '/' && !isAuthenticated) {
      safeRedirect('/login')
    }
  }, [isAuthenticated, isLoading, pathname, safeRedirect])

  return <>{children}</>
}

// Hook pour protéger les pages privées
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    // Ne pas rediriger pendant le chargement
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

    if (!isAuthenticated && !isPublicRoute) {
      try {
        router.replace('/login')
      } catch (error) {
        console.error('Redirect failed in useRequireAuth:', error)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  return isAuthenticated
}

// Composant de loading pendant la vérification auth
export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { user, tokens, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Si on est sur une route publique, afficher directement
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si on est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si on a des tokens mais pas encore récupéré l'utilisateur, afficher un loader
  if (tokens?.accessToken && !user && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Récupération des informations utilisateur...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Composant pour valider les permissions d'accès
export function RouteGuard({ 
  children, 
  requiredPermissions = [],
  fallbackUrl = '/dashboard' 
}: {
  children: React.ReactNode
  requiredPermissions?: string[]
  fallbackUrl?: string
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      try {
        router.replace('/login')
      } catch (error) {
        console.error('Redirect failed in RouteGuard:', error)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      return
    }

    if (requiredPermissions.length > 0 && user) {
      const hasPermission = requiredPermissions.some(permission => 
        user.role === permission || 
        user.permissions?.includes(permission)
      )

      if (!hasPermission) {
        try {
          router.replace(fallbackUrl)
        } catch (error) {
          console.error('Permission redirect failed:', error)
          if (typeof window !== 'undefined') {
            window.location.href = fallbackUrl
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredPermissions, router, fallbackUrl])

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  // Ne pas afficher le contenu si pas authentifié
  if (!isAuthenticated) {
    return null
  }

  // Vérifier les permissions si spécifiées
  if (requiredPermissions.length > 0 && user) {
    const hasPermission = requiredPermissions.some(permission => 
      user.role === permission || 
      user.permissions?.includes(permission)
    )

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
