'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackUrl?: string
}

export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  fallbackUrl = '/login' 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Rediriger vers la page de login si non authentifié
      router.replace(fallbackUrl)
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
  }, [isLoading, isAuthenticated, user, requiredRoles, router, fallbackUrl])

  // Afficher le loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Ne pas afficher le contenu si pas authentifié
  if (!isAuthenticated || !user) {
    return null
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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