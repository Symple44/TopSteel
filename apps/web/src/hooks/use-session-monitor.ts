/**
 * Hook pour surveiller la session et déconnecter automatiquement
 * l'utilisateur quand le token JWT expire.
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { authStorage } from '../lib/auth/auth-storage'

interface SessionMonitorOptions {
  /** Intervalle de vérification en ms (défaut: 60000 = 1 minute) */
  checkInterval?: number
  /** Temps avant expiration pour rafraîchir le token en ms (défaut: 300000 = 5 minutes) */
  refreshBeforeExpiry?: number
  /** Callback appelé avant la déconnexion automatique */
  onBeforeLogout?: () => void
  /** Callback appelé après la déconnexion automatique */
  onLogout?: () => void
  /** Callback appelé quand le token est rafraîchi */
  onTokenRefresh?: () => void
  /** Désactiver le monitoring (utile pour les tests) */
  disabled?: boolean
}

/**
 * Hook qui surveille l'expiration de la session et gère le logout automatique
 */
export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    checkInterval = 60000, // 1 minute
    refreshBeforeExpiry = 300000, // 5 minutes
    onBeforeLogout,
    onLogout,
    onTokenRefresh,
    disabled = false,
  } = options

  const { isAuthenticated, logout, tokens, refreshTokens } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  /**
   * Vérifie si le token est expiré ou proche de l'expiration
   */
  const checkTokenExpiration = useCallback(async () => {
    if (!isAuthenticated || !tokens) return

    const now = Date.now()
    const expiresAt = tokens.expiresAt || 0

    // Token déjà expiré
    if (expiresAt <= now) {
      onBeforeLogout?.()
      await logout()
      onLogout?.()
      return
    }

    // Token proche de l'expiration - tenter de rafraîchir
    const timeUntilExpiry = expiresAt - now
    if (timeUntilExpiry <= refreshBeforeExpiry && !isRefreshingRef.current) {
      isRefreshingRef.current = true
      try {
        await refreshTokens()
        onTokenRefresh?.()
      } catch (error) {
        // Échec du rafraîchissement - déconnecter
        onBeforeLogout?.()
        await logout()
        onLogout?.()
      } finally {
        isRefreshingRef.current = false
      }
    }
  }, [
    isAuthenticated,
    tokens,
    refreshBeforeExpiry,
    logout,
    refreshTokens,
    onBeforeLogout,
    onLogout,
    onTokenRefresh,
  ])

  /**
   * Vérifie aussi via le storage (pour sync multi-onglets)
   */
  const checkStoredSession = useCallback(async () => {
    const storedSession = authStorage?.getStoredSession()

    if (!storedSession?.tokens) {
      // Pas de session stockée mais authentifié en mémoire - incohérence
      if (isAuthenticated) {
        onBeforeLogout?.()
        await logout()
        onLogout?.()
      }
      return
    }

    // Vérifier expiration via storage
    if (authStorage?.areTokensExpired(storedSession.tokens)) {
      onBeforeLogout?.()
      await logout()
      onLogout?.()
    }
  }, [isAuthenticated, logout, onBeforeLogout, onLogout])

  // Démarrer le monitoring
  useEffect(() => {
    if (disabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Vérification initiale
    checkTokenExpiration()
    checkStoredSession()

    // Vérification périodique
    intervalRef.current = setInterval(() => {
      checkTokenExpiration()
      checkStoredSession()
    }, checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    disabled,
    isAuthenticated,
    checkInterval,
    checkTokenExpiration,
    checkStoredSession,
  ])

  // Écouter les événements de visibilité (onglet actif)
  useEffect(() => {
    if (disabled || !isAuthenticated) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Vérifier immédiatement quand l'onglet redevient actif
        checkTokenExpiration()
        checkStoredSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [disabled, isAuthenticated, checkTokenExpiration, checkStoredSession])

  return {
    /** Force une vérification immédiate */
    checkNow: checkTokenExpiration,
    /** Indique si un rafraîchissement est en cours */
    isRefreshing: isRefreshingRef.current,
  }
}

/**
 * Hook simplifié pour le logout automatique avec paramètres par défaut
 */
export function useAutoLogout() {
  return useSessionMonitor({
    checkInterval: 30000, // 30 secondes
    refreshBeforeExpiry: 300000, // 5 minutes avant expiration
    onLogout: () => {
      // Rediriger vers login après logout automatique
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired'
      }
    },
  })
}
