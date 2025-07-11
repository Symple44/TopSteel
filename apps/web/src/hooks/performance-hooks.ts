/**
 * 🚀 HOOKS DE PERFORMANCE - TopSteel ERP
 * Hooks dédiés au monitoring et à l'optimisation des performances
 * Fichier: apps/web/src/hooks/performance-hooks.ts
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'

// ===== TYPES =====
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  memory?: number
  renderCount?: number
}

interface SelectorPerformance {
  calls: number
  totalTime: number
  averageTime: number
  maxTime: number
  minTime: number
  errors: number
  lastCall: number
}

interface RenderMetrics {
  componentName: string
  renderCount: number
  lastRender: number
  averageRenderTime: number
  propsChanges: number
}

// ===== HOOK POUR MONITORING DES PERFORMANCES =====
export function usePerformanceMonitor(componentName: string) {
  const metricsRef = useRef<PerformanceMetric[]>([])
  const renderCountRef = useRef(0)
  const lastRenderRef = useRef(performance.now())

  const startMeasure = useCallback(
    (measureName: string) => {
      const startTime = performance.now()

      return {
        end: () => {
          const endTime = performance.now()
          const duration = endTime - startTime

          const metric: PerformanceMetric = {
            name: `${componentName}.${measureName}`,
            duration,
            timestamp: Date.now(),
            memory: (performance as any).memory?.usedJSHeapSize,
          }

          metricsRef.current.push(metric)

          // Garder seulement les 100 dernières mesures
          if (metricsRef.current.length > 100) {
            metricsRef.current.shift()
          }

          // Log si c'est lent
          if (duration > 16) {
            // Plus de 1 frame à 60fps
            console.warn(
              `🐌 Opération lente dans ${componentName}.${measureName}: ${duration.toFixed(2)}ms`
            )
          }

          return duration
        },
      }
    },
    [componentName]
  )

  const getMetrics = useCallback(() => {
    const now = performance.now()
    const currentRenderTime = now - lastRenderRef.current

    renderCountRef.current++
    lastRenderRef.current = now

    return {
      componentName,
      renderCount: renderCountRef.current,
      lastRenderTime: currentRenderTime,
      totalMetrics: metricsRef.current.length,
      averageOperationTime:
        metricsRef.current.length > 0
          ? metricsRef.current.reduce((acc, m) => acc + m.duration, 0) / metricsRef.current.length
          : 0,
      slowOperations: metricsRef.current.filter((m) => m.duration > 16).length,
    }
  }, [componentName])

  const clearMetrics = useCallback(() => {
    metricsRef.current = []
    renderCountRef.current = 0
  }, [])

  return {
    startMeasure,
    getMetrics,
    clearMetrics,
    metrics: metricsRef.current,
  }
}

// ===== HOOK POUR OPTIMISATION DES RE-RENDERS =====
export function useRenderOptimization<T>(
  value: T,
  options: {
    name?: string
    logChanges?: boolean
    equalityFn?: (prev: T, next: T) => boolean
  } = {}
) {
  const { name = 'unknown', logChanges = false, equalityFn = shallow } = options

  const prevValueRef = useRef<T>(value)
  const renderCountRef = useRef(0)
  const changesRef = useRef<Array<{ timestamp: number; reason: string }>>([])

  const hasChanged = useMemo(() => {
    const changed = !equalityFn(prevValueRef.current, value)

    if (changed) {
      const changeInfo = {
        timestamp: Date.now(),
        reason: `Value changed in ${name}`,
      }

      changesRef.current.push(changeInfo)

      // Garder seulement les 50 derniers changements
      if (changesRef.current.length > 50) {
        changesRef.current.shift()
      }

      if (logChanges) {
      }
    }

    prevValueRef.current = value
    renderCountRef.current++

    return changed
  }, [value, name, logChanges, equalityFn])

  const getOptimizationStats = useCallback(
    () => ({
      name,
      renderCount: renderCountRef.current,
      changeCount: changesRef.current.length,
      lastChange: changesRef.current[changesRef.current.length - 1],
      unnecessaryRenders: Math.max(0, renderCountRef.current - changesRef.current.length),
      optimizationRatio:
        changesRef.current.length > 0
          ? (changesRef.current.length / renderCountRef.current) * 100
          : 100,
    }),
    [name]
  )

  return {
    hasChanged,
    renderCount: renderCountRef.current,
    getOptimizationStats,
  }
}

// ===== HOOK POUR DEBOUNCE OPTIMISÉ =====
export function useOptimizedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
    equalityFn?: (prev: T, next: T) => boolean
  } = {}
) {
  const { leading = false, trailing = true, maxWait, equalityFn = Object.is } = options

  const [debouncedValue, setDebouncedValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCallTimeRef = useRef(0)
  const lastValueRef = useRef(value)

  useEffect(() => {
    // Ne pas debouncer si la valeur n'a pas changé
    if (equalityFn(lastValueRef.current, value)) {
      return
    }

    const now = Date.now()

    lastCallTimeRef.current = now
    lastValueRef.current = value

    // Exécution immédiate (leading edge)
    if (leading && !timeoutRef.current) {
      setDebouncedValue(value)
    }

    // Nettoyer les timeouts existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Timeout pour trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        timeoutRef.current = null

        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current)
          maxTimeoutRef.current = null
        }
      }, delay)
    }

    // MaxWait timeout
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        maxTimeoutRef.current = null
      }, maxWait)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current)
      }
    }
  }, [value, delay, leading, trailing, maxWait, equalityFn])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    cancel()
    setDebouncedValue(lastValueRef.current)
  }, [cancel])

  return {
    debouncedValue,
    cancel,
    flush,
    isPending: !!timeoutRef.current,
  }
}

// ===== HOOK POUR CACHE INTELLIGENT =====
export function useIntelligentCache<K, V>(
  options: { maxSize?: number; ttl?: number; onEvict?: (key: K, value: V) => void } = {}
) {
  const { maxSize = 100, ttl = 300000, onEvict } = options // 5 minutes par défaut

  const cacheRef = useRef(
    new Map<
      K,
      {
        value: V
        timestamp: number
        hitCount: number
        lastAccess: number
      }
    >()
  )
  const [cacheSize, setCacheSize] = useState(0)

  const get = useCallback(
    (key: K): V | undefined => {
      const cache = cacheRef.current
      const entry = cache.get(key)

      if (!entry) return undefined

      const now = Date.now()

      // Vérifier la validité du cache
      if (ttl && now - entry.timestamp > ttl) {
        cache.delete(key)
        setCacheSize(cache.size)

        return undefined
      }

      // Mettre à jour les statistiques d'accès
      entry.hitCount++
      entry.lastAccess = now

      return entry.value
    },
    [ttl]
  )

  const set = useCallback(
    (key: K, value: V): void => {
      const cache = cacheRef.current
      const now = Date.now()

      // Supprimer l'ancienne entrée si elle existe
      const existingEntry = cache.get(key)

      if (existingEntry && onEvict) {
        onEvict(key, existingEntry.value)
      }

      // Vérifier la taille du cache
      if (cache.size >= maxSize && !cache.has(key)) {
        // Éviction LRU (Least Recently Used)
        let lruKey: K | undefined

        let lruTime = Number.POSITIVE_INFINITY

        for (const [k, entry] of cache.entries()) {
          if (entry.lastAccess < lruTime) {
            lruTime = entry.lastAccess
            lruKey = k
          }
        }

        if (lruKey !== undefined) {
          const evictedEntry = cache.get(lruKey)

          cache.delete(lruKey)
          if (evictedEntry && onEvict) {
            onEvict(lruKey, evictedEntry.value)
          }
        }
      }

      // Ajouter la nouvelle entrée
      cache.set(key, {
        value,
        timestamp: now,
        hitCount: 0,
        lastAccess: now,
      })

      setCacheSize(cache.size)
    },
    [maxSize, onEvict]
  )

  const remove = useCallback(
    (key: K): boolean => {
      const cache = cacheRef.current
      const entry = cache.get(key)
      const deleted = cache.delete(key)

      if (deleted && entry && onEvict) {
        onEvict(key, entry.value)
      }

      setCacheSize(cache.size)

      return deleted
    },
    [onEvict]
  )

  const clear = useCallback(() => {
    const cache = cacheRef.current

    if (onEvict) {
      for (const [key, entry] of cache.entries()) {
        onEvict(key, entry.value)
      }
    }

    cache.clear()
    setCacheSize(0)
  }, [onEvict])

  const getStats = useCallback(() => {
    const cache = cacheRef.current
    const now = Date.now()
    let totalHits = 0
    let expiredEntries = 0

    for (const entry of cache.values()) {
      totalHits += entry.hitCount
      if (ttl && now - entry.timestamp > ttl) {
        expiredEntries++
      }
    }

    return {
      size: cache.size,
      maxSize,
      totalHits,
      expiredEntries,
      hitRate: cache.size > 0 ? totalHits / cache.size : 0,
    }
  }, [maxSize, ttl])

  // Nettoyage automatique des entrées expirées
  useEffect(() => {
    if (!ttl) return

    const interval = setInterval(
      () => {
        const cache = cacheRef.current
        const now = Date.now()
        const keysToDelete: K[] = []

        for (const [key, entry] of cache.entries()) {
          if (now - entry.timestamp > ttl) {
            keysToDelete.push(key)
          }
        }

        for (const key of keysToDelete) {
          const entry = cache.get(key)

          cache.delete(key)
          if (entry && onEvict) {
            onEvict(key, entry.value)
          }
        }

        if (keysToDelete.length > 0) {
          setCacheSize(cache.size)
        }
      },
      Math.min(ttl / 4, 60000)
    ) // Nettoyer au maximum toutes les minutes

    return () => clearInterval(interval)
  }, [ttl, onEvict])

  return {
    get,
    set,
    remove,
    clear,
    size: cacheSize,
    getStats,
  }
}

// ===== HOOK POUR MONITORING DES SÉLECTEURS ZUSTAND =====
export function useSelectorPerformanceMonitor() {
  const metricsRef = useRef<Map<string, SelectorPerformance>>(new Map())

  const wrapSelector = useCallback(<T, R>(name: string, selector: (state: T) => R) => {
    return (state: T): R => {
      const start = performance.now()

      try {
        const result = selector(state)
        const duration = performance.now() - start

        const metrics = metricsRef.current.get(name) || {
          calls: 0,
          totalTime: 0,
          averageTime: 0,
          maxTime: 0,
          minTime: Number.POSITIVE_INFINITY,
          errors: 0,
          lastCall: 0,
        }

        metrics.calls++
        metrics.totalTime += duration
        metrics.averageTime = metrics.totalTime / metrics.calls
        metrics.maxTime = Math.max(metrics.maxTime, duration)
        metrics.minTime = Math.min(metrics.minTime, duration)
        metrics.lastCall = Date.now()

        metricsRef.current.set(name, metrics)

        // Log si c'est lent
        if (duration > 1) {
          console.warn(`🐌 Sélecteur lent "${name}": ${duration.toFixed(2)}ms`)
        }

        return result
      } catch (error) {
        const metrics = metricsRef.current.get(name) || {
          calls: 0,
          totalTime: 0,
          averageTime: 0,
          maxTime: 0,
          minTime: Number.POSITIVE_INFINITY,
          errors: 0,
          lastCall: 0,
        }

        metrics.errors++
        metricsRef.current.set(name, metrics)

        console.error(`❌ Erreur dans le sélecteur "${name}":`, error)
        throw error
      }
    }
  }, [])

  const getMetrics = useCallback((name?: string) => {
    if (name) {
      return metricsRef.current.get(name) || null
    }

    return Object.fromEntries(metricsRef.current.entries())
  }, [])

  const getTopSlowSelectors = useCallback((limit = 5) => {
    return Array.from(metricsRef.current.entries())
      .sort(([, a], [, b]) => b.averageTime - a.averageTime)
      .slice(0, limit)
      .map(([name, metrics]) => ({ name, ...metrics }))
  }, [])

  const clearMetrics = useCallback(() => {
    metricsRef.current.clear()
  }, [])

  return {
    wrapSelector,
    getMetrics,
    getTopSlowSelectors,
    clearMetrics,
  }
}

// ===== HOOK POUR DÉTECTION DES FUITES MÉMOIRE =====
export function useMemoryLeakDetector(componentName: string) {
  const mountTimeRef = useRef(Date.now())
  const memorySnapshotsRef = useRef<Array<{ timestamp: number; memory: number }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      if ((performance as any).memory) {
        const memoryUsage = (performance as any).memory.usedJSHeapSize

        memorySnapshotsRef.current.push({
          timestamp: Date.now(),
          memory: memoryUsage,
        })

        // Garder seulement les mesures des 5 dernières minutes
        const fiveMinutesAgo = Date.now() - 300000

        memorySnapshotsRef.current = memorySnapshotsRef.current.filter(
          (snapshot) => snapshot.timestamp > fiveMinutesAgo
        )

        // Détecter une croissance anormale de la mémoire
        if (memorySnapshotsRef.current.length >= 10) {
          const recent = memorySnapshotsRef.current.slice(-10)
          const growth = recent[recent.length - 1].memory - recent[0].memory

          if (growth > 50 * 1024 * 1024) {
            // 50MB de croissance
            console.warn(
              `🚨 Fuite mémoire potentielle détectée dans ${componentName}: +${(growth / 1024 / 1024).toFixed(2)}MB`
            )
          }
        }
      }
    }, 10000) // Vérifier toutes les 10 secondes

    return () => clearInterval(interval)
  }, [componentName])

  const getMemoryStats = useCallback(() => {
    if (memorySnapshotsRef.current.length === 0) return null

    const latest = memorySnapshotsRef.current[memorySnapshotsRef.current.length - 1]
    const oldest = memorySnapshotsRef.current[0]
    const growth = latest.memory - oldest.memory

    return {
      componentName,
      currentMemory: latest.memory,
      memoryGrowth: growth,
      uptime: Date.now() - mountTimeRef.current,
      snapshots: memorySnapshotsRef.current.length,
    }
  }, [componentName])

  return { getMemoryStats }
}

// ===== EXPORTATIONS =====
export type { PerformanceMetric, RenderMetrics, SelectorPerformance }
