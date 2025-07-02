// apps/web/src/hooks/use-store-ssr.ts
import { useEffect, useState } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'

/**
 * ✅ SOLUTION CRITIQUE: Hook SSR-safe pour stores Zustand
 * Évite les erreurs getServerSnapshot et useSyncExternalStore
 */
export function useStoreSSR<T, U>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => U,
  fallback: U
): U {
  const [isHydrated, setIsHydrated] = useState(false)
  const [fallbackState, setFallbackState] = useState(fallback)

  // ✅ Marquer comme hydraté côté client
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ✅ Utiliser le store seulement après hydratation
  try {
    if (isHydrated) {
      return store(selector)
    }
    return fallbackState
  } catch (error) {
    // ✅ Fallback en cas d'erreur store
    console.warn('Store SSR error:', error)
    return fallbackState
  }
}

/**
 * ✅ Version simplifiée sans imports dynamiques
 */
export function useHydrationSafe<T>(callback: () => T, fallback: T): T {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return fallback
  }

  try {
    return callback()
  } catch (error) {
    console.warn('Store hydration error:', error)
    return fallback
  }
}