// apps/web/src/hooks/use-store-ssr.ts - VERSION FIXEE
import { useEffect, useState, useCallback, useMemo } from 'react'

export function useHydrationSafe<T>(callback: () => T, fallback: T): T {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Mémoriser le fallback pour éviter les re-renders
  const memoizedFallback = useMemo(() => fallback, [])
  
  // Utiliser callback stable
  const stableCallback = useCallback(callback, [])

  if (!isHydrated) {
    return memoizedFallback
  }

  try {
    return stableCallback()
  } catch (error) {
    console.warn('Store hydration error:', error)
    return memoizedFallback
  }
}
