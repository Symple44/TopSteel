'use client'

import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/services/auth.service'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

// Routes qui redirigent automatiquement si déjà connecté
const AUTH_ROUTES = ['/login', '/register']

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, tokens, isAuthenticated, setUser, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Nettoyer les sessions au démarrage de l'application (une seule fois)
  useEffect(() => {
    // Vérifier si c'est le premier chargement de la session
    if (typeof window !== 'undefined' && !sessionStorage.getItem('topsteel-session-initialized')) {
      // Supprimer les données d'authentification du localStorage
      localStorage.removeItem('topsteel-auth')
      localStorage.removeItem('topsteel-tokens')
      
      // Marquer la session comme initialisée pour éviter de nettoyer à nouveau
      sessionStorage.setItem('topsteel-session-initialized', 'true')
      
      // Forcer la réinitialisation de l'état d'authentification
      logout()
      
      console.log('Sessions cleared on initial startup')
    }
  }, [logout])

  // Gestion des redirections basées sur l'état d'authentification
  useEffect(() => {
    // Ne pas faire de redirections si on est encore en train de charger
    if (typeof window === 'undefined') return

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

    // Si l'utilisateur est connecté et sur une page d'auth, rediriger vers dashboard
    if (isAuthenticated && isAuthRoute) {
      router.replace('/dashboard')
      return
    }

    // Si l'utilisateur n'est pas connecté et sur une page privée, rediriger vers login
    if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
      router.replace('/login')
      return
    }

    // Redirection depuis la page racine
    if (pathname === '/') {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}

// Hook pour protéger les pages privées
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
    }
  }, [isAuthenticated, pathname, router])

  return isAuthenticated
}

// Composant de loading pendant la vérification auth
export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { user, tokens, isAuthenticated } = useAuth()
  const pathname = usePathname()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Si on est sur une route publique, afficher directement
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si on a des tokens mais pas encore récupéré l'utilisateur, afficher un loader
  if (tokens?.accessToken && !user && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
