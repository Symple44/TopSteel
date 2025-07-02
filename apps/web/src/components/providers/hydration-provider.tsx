'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useProjetStore } from '@/stores/projet.store'
import { useUIStore } from '@/stores/ui.store'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface HydrationProviderProps {
  children: ReactNode
  fallbackComponent?: ReactNode
  onHydrationComplete?: () => void
  onHydrationError?: (error: Error) => void
  enableMetrics?: boolean
}

interface HydrationStatus {
  phase: 'initializing' | 'hydrating' | 'complete' | 'error'
  progress: number
  startTime: number
  stores: {
    auth: boolean
    projets: boolean
    ui: boolean
  }
  error?: Error
}

/**
 * ✅ HYDRATION PROVIDER ENTERPRISE
 * 
 * Fonctionnalités:
 * - Hydratation séquentielle sécurisée
 * - Monitoring de performance
 * - Gestion d'erreurs robuste
 * - Métriques et analytics
 * - Fallbacks intelligents
 * - Recovery automatique
 */
export function HydrationProvider({
  children,
  fallbackComponent,
  onHydrationComplete,
  onHydrationError,
  enableMetrics = process.env.NODE_ENV === 'development'
}: HydrationProviderProps) {
  // ✅ ÉTAT DE L'HYDRATATION
  const [status, setStatus] = useState<HydrationStatus>({
    phase: 'initializing',
    progress: 0,
    startTime: Date.now(),
    stores: {
      auth: false,
      projets: false,
      ui: false
    }
  })

  const hydrationAttemptedRef = useRef(false)
  const metricsRef = useRef<any>({})

  // ✅ HYDRATATION ENTERPRISE
  useEffect(() => {
    if (hydrationAttemptedRef.current) return
    hydrationAttemptedRef.current = true

    const hydrateStores = async () => {
      const startTime = performance.now()
      
      try {
        setStatus(prev => ({ 
          ...prev, 
          phase: 'hydrating',
          progress: 10 
        }))

        // ✅ ÉTAPE 1: Hydratation Store UI (critique pour layout)
        await hydrateStore('ui', useUIStore, 30)
        
        // ✅ ÉTAPE 2: Hydratation Store Auth (utilisateur)
        await hydrateStore('auth', useAuthStore, 60)
        
        // ✅ ÉTAPE 3: Hydratation Store Projets (données métier)
        await hydrateStore('projets', useProjetStore, 90)

        // ✅ FINALISATION
        const endTime = performance.now()
        const duration = endTime - startTime

        setStatus(prev => ({
          ...prev,
          phase: 'complete',
          progress: 100
        }))

        // ✅ MÉTRIQUES DE PERFORMANCE
        if (enableMetrics) {
          metricsRef.current = {
            duration,
            storesHydrated: 3,
            success: true,
            timestamp: Date.now()
          }

          console.info(`🚀 Hydratation complète en ${duration.toFixed(2)}ms`)
          
          // Envoyer métriques vers analytics si disponible
          if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('hydration_complete', {
              duration: Math.round(duration),
              stores: ['auth', 'projets', 'ui'],
              success: true
            })
          }
        }

        // ✅ CALLBACK SUCCESS
        onHydrationComplete?.()

      } catch (error) {
        const hydrationError = error instanceof Error ? error : new Error('Hydration failed')
        
        setStatus(prev => ({
          ...prev,
          phase: 'error',
          error: hydrationError
        }))

        console.error('💥 Erreur hydratation:', hydrationError)
        
        // ✅ MÉTRIQUES D'ERREUR
        if (enableMetrics && typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('hydration_error', {
            error: hydrationError.message,
            phase: status.phase,
            progress: status.progress
          })
        }

        onHydrationError?.(hydrationError)
      }
    }

    // ✅ DÉLAI MICRO-TASK POUR ÉVITER RACES CONDITIONS
    const timeoutId = setTimeout(hydrateStores, 0)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [enableMetrics, onHydrationComplete, onHydrationError])

  // ✅ FONCTION D'HYDRATATION D'UN STORE
  const hydrateStore = async (
    name: keyof HydrationStatus['stores'], 
    store: any, 
    targetProgress: number
  ) => {
    try {
      // ✅ Vérifier si le store a une méthode persist
      if (!store.persist) {
        // Store sans persistance, marquer comme hydraté
        setStatus(prev => ({
          ...prev,
          stores: { ...prev.stores, [name]: true },
          progress: targetProgress
        }))
        return
      }

      // ✅ Attendre hydratation avec timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout hydratation store ${name}`))
        }, 10000) // 10s timeout

        // Si déjà hydraté
        if (store.persist.hasHydrated && store.persist.hasHydrated()) {
          clearTimeout(timeout)
          resolve()
          return
        }

        // Déclencher hydratation
        store.persist.rehydrate()

        // Attendre fin d'hydratation
        const unsubscribe = store.persist.onFinishHydration?.(() => {
          clearTimeout(timeout)
          unsubscribe?.()
          resolve()
        }) || (() => {
          // Fallback si pas de callback
          setTimeout(() => {
            clearTimeout(timeout)
            resolve()
          }, 100)
        })
      })

      // ✅ Marquer store comme hydraté
      setStatus(prev => ({
        ...prev,
        stores: { ...prev.stores, [name]: true },
        progress: targetProgress
      }))

      console.debug(`✅ Store ${name} hydraté`)

    } catch (error) {
      console.warn(`⚠️ Erreur hydratation store ${name}:`, error)
      
      // ✅ Continuer même en cas d'erreur pour un store
      setStatus(prev => ({
        ...prev,
        stores: { ...prev.stores, [name]: true }, // Marquer comme "hydraté" pour continuer
        progress: targetProgress
      }))
    }
  }

  // ✅ COMPOSANT DE FALLBACK INTELLIGENT
  const renderFallback = () => {
    if (fallbackComponent) {
      return fallbackComponent
    }

    // ✅ Fallback par défaut avec état d'hydratation
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center max-w-md">
          {/* Logo/Icône */}
          <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-white/20 animate-pulse" />
          </div>

          {/* Titre */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status.phase === 'error' ? 'Erreur d\'initialisation' : 'TopSteel ERP'}
          </h2>
          
          {/* Message de statut */}
          <p className="text-sm text-gray-600 mb-6">
            {status.phase === 'initializing' && 'Préparation...'}
            {status.phase === 'hydrating' && 'Chargement des données...'}
            {status.phase === 'error' && 'Une erreur est survenue'}
          </p>

          {/* Barre de progression Enterprise */}
          {status.phase !== 'error' && (
            <div className="relative mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {status.progress}%
              </div>
            </div>
          )}

          {/* Indicateurs stores */}
          <div className="flex justify-center space-x-3 mb-6">
            {Object.entries(status.stores).map(([storeName, isHydrated]) => (
              <div
                key={storeName}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isHydrated ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={`Store ${storeName}: ${isHydrated ? 'Hydraté' : 'En cours'}`}
              />
            ))}
          </div>

          {/* Gestion d'erreur */}
          {status.phase === 'error' && (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-4">
                {status.error?.message || 'Erreur inconnue'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recharger l'application
              </button>
            </div>
          )}

          {/* Métriques dev */}
          {enableMetrics && status.phase === 'hydrating' && (
            <div className="text-xs text-gray-400 mt-4">
              {(performance.now() - status.startTime).toFixed(0)}ms
            </div>
          )}
        </div>
      </div>
    )
  }

  // ✅ RENDU CONDITIONNEL
  if (status.phase !== 'complete') {
    return renderFallback()
  }

  // ✅ WRAPPER FINAL AVEC MONITORING
  return (
    <div className="min-h-screen" data-hydrated="true">
      {children}
      
      {/* Dev tools hydratation */}
      {enableMetrics && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50">
          Hydratation: {(performance.now() - status.startTime).toFixed(0)}ms
        </div>
      )}
    </div>
  )
}




