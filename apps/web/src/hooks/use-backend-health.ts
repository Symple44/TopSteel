/**
 * Hook pour vérifier la santé du backend - VERSION SIMPLIFIÉE
 * Fichier: apps/web/src/hooks/use-backend-health.ts
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../lib/i18n'
import { callClientApi } from '../utils/backend-api'

export interface BackendHealthInfo {
  status: 'online' | 'offline' | 'checking' | 'error'
  responseTime: number | null
  lastCheck: Date | null
  version: string | null
  environment: string | null
  uptime: string | null
  database: 'connected' | 'disconnected' | 'unknown'
  activeUsers: number | null
  error?: string
}

interface UseBackendHealthReturn {
  health: BackendHealthInfo
  checkHealth: () => Promise<void>
  isChecking: boolean
}

const initialHealth: BackendHealthInfo = {
  status: 'checking',
  responseTime: null,
  lastCheck: null,
  version: null,
  environment: null,
  uptime: null,
  database: 'unknown',
  activeUsers: null,
}

// Cache global simple - une seule vérification au démarrage
let cachedHealthState: BackendHealthInfo = initialHealth
let isInitialized = false

// Liste des listeners pour synchroniser les hooks
const listeners: Array<(health: BackendHealthInfo) => void> = []

// Fonction pour notifier tous les listeners
function notifyListeners(health: BackendHealthInfo) {
  listeners?.forEach((listener) => {
    listener(health)
  })
}

// Fonction de vérification simplifiée
async function performHealthCheck(): Promise<BackendHealthInfo> {
  const startTime = Date.now()

  try {
    const response = await callClientApi('health', {
      method: 'GET',
      signal: AbortSignal?.timeout(8000),
    })

    const responseTime = Date.now() - startTime

    if (response?.ok) {
      const data = await response?.json()
      return {
        status: 'online',
        responseTime,
        lastCheck: new Date(),
        version: data.version || 'Unknown',
        environment: data.environment || 'Unknown',
        uptime: data.uptime || null,
        database: data.database?.connectionStatus === 'connected' ? 'connected' : 'disconnected',
        activeUsers: data.activeUsers || null,
      }
    } else {
      return {
        status: 'error',
        responseTime,
        lastCheck: new Date(),
        version: null,
        environment: null,
        uptime: null,
        database: 'unknown',
        activeUsers: null,
        error: `HTTP ${response?.status}: ${response?.statusText}`,
      }
    }
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      version: null,
      environment: null,
      uptime: null,
      database: 'unknown',
      activeUsers: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Initialisation unique au démarrage
async function initializeHealthCheck(): Promise<void> {
  if (isInitialized) return

  isInitialized = true
  cachedHealthState = { ...initialHealth, status: 'checking' }
  notifyListeners(cachedHealthState)

  try {
    cachedHealthState = await performHealthCheck()
    notifyListeners(cachedHealthState)
  } catch (_error) {
    cachedHealthState = {
      ...initialHealth,
      status: 'error',
      lastCheck: new Date(),
      error: 'Failed to initialize health check',
    }
    notifyListeners(cachedHealthState)
  }
}

export function useBackendHealth(): UseBackendHealthReturn {
  const [health, setHealth] = useState<BackendHealthInfo>(cachedHealthState)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const newHealth = await performHealthCheck()
      cachedHealthState = newHealth
      setHealth(newHealth)
      notifyListeners(newHealth) // Notifier tous les autres hooks
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    // Initialisation au premier montage seulement
    initializeHealthCheck().then(() => {
      setHealth(cachedHealthState)
    })
  }, [])

  return {
    health,
    checkHealth,
    isChecking,
  }
}

// Hook simplifié pour le statut uniquement
export function useBackendStatus() {
  const [health, setHealth] = useState<BackendHealthInfo>(cachedHealthState)
  const { t } = useTranslation('common')

  useEffect(() => {
    // Ajouter ce hook aux listeners pour recevoir les mises à jour
    const listener = (newHealth: BackendHealthInfo) => {
      setHealth(newHealth)
    }

    listeners?.push(listener)

    // Initialisation au premier montage seulement
    initializeHealthCheck().then(() => {
      setHealth(cachedHealthState)
    })

    // Cleanup: retirer le listener quand le composant se démonte
    return () => {
      const index = listeners?.indexOf(listener)
      if (index > -1) {
        listeners?.splice(index, 1)
      }
    }
  }, [])

  return {
    isOnline: health.status === 'online',
    isOffline: health.status === 'offline',
    isChecking: health.status === 'checking',
    hasError: health.status === 'error',
    statusColor:
      health.status === 'online'
        ? 'bg-emerald-500'
        : health.status === 'offline'
          ? 'bg-red-500'
          : health.status === 'error'
            ? 'bg-orange-500'
            : 'bg-gray-500',
    statusText:
      health.status === 'online'
        ? t('backend.status.online')
        : health.status === 'offline'
          ? t('backend.status.offline')
          : health.status === 'error'
            ? t('backend.status.error')
            : t('backend.status.checking'),
  }
}
