'use client'

import { AlertTriangle, Loader2, Server } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useBackendHealth } from '../../hooks/use-backend-health'
import { useStartupLogger } from '../../lib/startup-logger'

interface AppInitializerProps {
  children: React.ReactNode
}

export function AppInitializer({ children }: AppInitializerProps) {
  const router = useRouter()
  const [initState, setInitState] = useState<'checking' | 'success' | 'backend-error'>('checking')
  const { health } = useBackendHealth()

  // Active les logs côté client
  useStartupLogger()

  useEffect(() => {
    if (health.status === 'online') {
      setInitState('success')
    } else if ((health.status === 'offline' || health.status === 'error') && health.lastCheck) {
      // Attendre un peu avant de considérer comme erreur
      setTimeout(() => {
        if (health.status === 'offline' || health.status === 'error') {
          setInitState('backend-error')
        }
      }, 2000)
    }
  }, [health.status, health.lastCheck])

  // Rediriger vers la page d'erreur backend si nécessaire
  useEffect(() => {
    if (initState === 'backend-error') {
      router?.push('/backend-error')
    }
  }, [initState, router])

  // Afficher l'écran de chargement pendant l'initialisation
  if (initState === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Server className="h-16 w-16 mx-auto text-blue-600 mb-4" />
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Initialisation de TopSteel ERP</h1>

          <div className="space-y-2 text-gray-600">
            <p>Vérification de la connexion au serveur...</p>
            <p className="text-sm">
              Statut :{' '}
              {health.error || (health.status === 'checking' ? 'Vérification...' : health.status)}
            </p>
          </div>

          <div className="mt-8 bg-gray-100 rounded-lg p-4 text-left max-w-md mx-auto">
            <h3 className="font-medium text-gray-900 mb-2">Étapes d'initialisation :</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {health.status === 'checking' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                ) : health.status === 'online' ? (
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                )}
                Connexion au serveur API
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                Vérification de l'authentification
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                Chargement de l'interface
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Afficher l'écran d'erreur si le backend n'est pas disponible
  if (initState === 'backend-error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirection en cours...</h1>
          <p className="text-gray-600">
            Le serveur n'est pas disponible. Redirection vers la page d'erreur.
          </p>
        </div>
      </div>
    )
  }

  // Si tout va bien, afficher l'application
  return <>{children}</>
}
