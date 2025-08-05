'use client'

import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

export interface HealthStatus {
  status: 'online' | 'offline' | 'error' | 'checking'
  error?: string
  responseTime?: number
  lastCheck?: Date
}

interface BackendStatusIndicatorProps {
  showDetails?: boolean
  className?: string
  health: HealthStatus
  onRetry?: () => Promise<void>
  translations?: {
    online?: string
    offline?: string
    error?: string
    checking?: string
    retry?: string
    available?: string
  }
}

export function BackendStatusIndicator({
  showDetails = false,
  className = '',
  health,
  onRetry,
  translations = {},
}: BackendStatusIndicatorProps) {
  const [showRetryButton, setShowRetryButton] = useState(false)

  const t = {
    online: translations.online || 'Backend connecté',
    offline: translations.offline || 'Backend non accessible',
    error: translations.error || 'Erreur backend',
    checking: translations.checking || 'Vérification en cours...',
    retry: translations.retry || 'Réessayer',
    available: translations.available || 'Backend disponible',
  }

  useEffect(() => {
    if (health.status === 'offline' || health.status === 'error') {
      setShowRetryButton(true)
    }
  }, [health.status])

  const handleRetry = async () => {
    if (onRetry) {
      setShowRetryButton(false)
      await onRetry()
    }
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
    <div
      className={`flex items-center gap-2 p-2 rounded-lg border ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}

      <div className="flex-1 text-sm">
        <div className="font-medium">
          {health.status === 'online' && t.online}
          {health.status === 'offline' && t.offline}
          {health.status === 'error' && t.error}
          {health.status === 'checking' && t.checking}
        </div>

        {showDetails && (
          <div className="text-xs opacity-75 mt-1">
            {health.error || t.available}
            {health.responseTime && ` (${health.responseTime}ms)`}
          </div>
        )}
      </div>

      {showRetryButton && onRetry && (health.status === 'offline' || health.status === 'error') && (
        <button
          onClick={handleRetry}
          className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
        >
          {t.retry}
        </button>
      )}
    </div>
  )
}

// Composant pour afficher une page d'attente pendant la vérification du backend
export interface BackendConnectionGuardProps {
  children: React.ReactNode
  health: HealthStatus
  apiUrl?: string
  translations?: {
    connecting?: string
    checkingAvailability?: string
    serverUnavailable?: string
    serverUnavailableDesc?: string
    toStartServer?: string
    attemptedUrl?: string
    lastCheck?: string
    never?: string
  }
}

export function BackendConnectionGuard({
  children,
  health,
  apiUrl,
  translations = {},
}: BackendConnectionGuardProps) {
  const [showFallback, setShowFallback] = useState(false)

  const t = {
    connecting: translations.connecting || 'Connexion au serveur...',
    checkingAvailability:
      translations.checkingAvailability || 'Vérification de la disponibilité du backend',
    serverUnavailable: translations.serverUnavailable || 'Serveur non accessible',
    serverUnavailableDesc:
      translations.serverUnavailableDesc || "Le serveur backend n'est pas disponible actuellement.",
    toStartServer: translations.toStartServer || 'Pour démarrer le serveur :',
    attemptedUrl: translations.attemptedUrl || 'URL tentée :',
    lastCheck: translations.lastCheck || 'Dernière vérification :',
    never: translations.never || 'Jamais',
  }

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
          <div className="text-lg font-medium text-gray-900">{t.connecting}</div>
          <div className="text-sm text-gray-600">{t.checkingAvailability}</div>
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
          <h1 className="text-xl font-semibold text-gray-900">{t.serverUnavailable}</h1>
          <p className="text-gray-600">{t.serverUnavailableDesc}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 text-left">
          <div className="font-medium mb-2">{t.toStartServer}</div>
          <div className="space-y-1 font-mono text-xs">
            <div>cd apps/api</div>
            <div>npm run dev</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div>
            {t.attemptedUrl} {apiUrl}
          </div>
          <div>
            {t.lastCheck} {health.lastCheck?.toLocaleTimeString() || t.never}
          </div>
        </div>

        <BackendStatusIndicator showDetails={true} health={health} />
      </div>
    </div>
  )
}
