'use client'

import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/services/auth.service'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
}

// Routes qui ne nécessitent pas d'authentification
const _PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/support'
]

// Routes qui redirigent automatiquement si déjà connecté
const _AUTH_ROUTES = ['/login', '/register']

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, tokens, isAuthenticated, setUser, logout } = useAuth()
  const _router = useRouter()
  const _pathname = usePathname()

  // Vérification de l'authentification au chargement
  useEffect(() => {
    let _isMounted = true

    const _checkAuth = async () => {
      // Si on a des tokens en local storage, vérifier leur validité
      if (tokens?.accessToken && !user) {
        try {
          const _userData = await authService.getMe()

          if (isMounted) {
            setUser(userData)
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'auth:', error)
          if (isMounted) {
            logout()
          }
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [tokens?.accessToken, user, setUser, logout])

  // Gestion des redirections basées sur l'état d'authentification
  useEffect(() => {
    const _isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname.startsWith(route)
    )
    const _isAuthRoute = AUTH_ROUTES.some(route => 
      pathname.startsWith(route)
    )

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
  const _router = useRouter()
  const _pathname = usePathname()

  useEffect(() => {
    const _isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname.startsWith(route)
    )

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
    }
  }, [isAuthenticated, pathname, router])

  return isAuthenticated
}

// Composant de loading pendant la vérification auth
export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { user, tokens, isAuthenticated } = useAuth()
  const _pathname = usePathname()

  const _isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  )

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
