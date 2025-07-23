'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useBackendHealth, BackendHealthInfo } from '@/hooks/use-backend-health'

interface BackendStatusIndicatorProps {
  showDetails?: boolean
  className?: string
}

export function BackendStatusIndicator({ 
  showDetails = false, 
  className = "" 
}: BackendStatusIndicatorProps) {
  const { health, checkHealth } = useBackendHealth()
  const [showRetryButton, setShowRetryButton] = useState(false)

  useEffect(() => {
    if (health.status === 'offline' || health.status === 'error') {
      setShowRetryButton(true)
    }
  }, [health.status])

  const handleRetry = async () => {
    setShowRetryButton(false)
    await checkHealth()
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (health.status) {
      case 'online':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'offline':
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'checking':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    }
  }

  if (!showDetails && health.status === 'online') {
    return null // Ne rien afficher si tout va bien et qu'on ne veut pas les détails
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      
      <div className="flex-1 text-sm">
        <div className="font-medium">
          {health.status === 'online' && 'Backend connecté'}
          {health.status === 'offline' && 'Backend non accessible'}
          {health.status === 'error' && 'Erreur backend'}
          {health.status === 'checking' && 'Vérification en cours...'}
        </div>
        
        {showDetails && (
          <div className="text-xs opacity-75 mt-1">
            {health.error || 'Backend disponible'}
            {health.responseTime && ` (${health.responseTime}ms)`}
          </div>
        )}
      </div>

      {showRetryButton && (health.status === 'offline' || health.status === 'error') && (
        <button
          onClick={handleRetry}
          className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

// Composant pour afficher une page d'attente pendant la vérification du backend
export function BackendConnectionGuard({ children }: { children: React.ReactNode }) {
  const { health } = useBackendHealth()
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    // Afficher l'écran de fallback après 3 secondes si le backend n'est toujours pas accessible
    const timer = setTimeout(() => {
      if (health.status === 'offline' || health.status === 'error') {
        setShowFallback(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [health.status])

  // Si le backend est accessible, afficher l'application normalement
  if (health.status === 'online') {
    return <>{children}</>
  }

  // Si on est en train de vérifier et qu'on n'a pas encore dépassé le délai
  if (health.status === 'checking' && !showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <div className="text-lg font-medium text-gray-900">
            Connexion au serveur...
          </div>
          <div className="text-sm text-gray-600">
            Vérification de la disponibilité du backend
          </div>
        </div>
      </div>
    )
  }

  // Si le backend n'est pas accessible après le délai
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Serveur non accessible
          </h1>
          <p className="text-gray-600">
            Le serveur backend n'est pas disponible actuellement.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 text-left">
          <div className="font-medium mb-2">Pour démarrer le serveur :</div>
          <div className="space-y-1 font-mono text-xs">
            <div>cd apps/api</div>
            <div>npm run dev</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div>URL tentée : {process.env.NEXT_PUBLIC_API_URL}</div>
          <div>Dernière vérification : {health.lastCheck?.toLocaleTimeString() || 'Jamais'}</div>
        </div>

        <BackendStatusIndicator showDetails={true} />
      </div>
    </div>
  )
}