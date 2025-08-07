/**
 * 🛠️ STORE UTILITIES ROBUSTES - TopSteel ERP
 * Utilitaires pour création et gestion des stores Zustand avec types stricts
 * Version corrigée - N'exporte QUE les utilitaires, types depuis @erp/types
 * Fichier: apps/web/src/lib/store-utils.ts
 */

import type {
  BaseStoreActions,
  BaseStoreState,
  InitialState,
  StoreConfig,
  StoreCreator,
} from '@erp/types' // ✅ Import UNIQUEMENT depuis @erp/types
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ===== TYPES LOCAUX UNIQUEMENT =====

interface CacheItem<T> {
  data: T
  timestamp: number
}

interface StoreEvent {
  timestamp: number
  store: string
  action: string
  state: unknown
  prevState?: unknown
  duration?: number
}

// ===== CLASSE PRINCIPALE STORE UTILS =====

/**
 * Créateur de store robuste avec middleware intégrés
 */
export function createRobustStore<
  TState extends BaseStoreState,
  TActions extends BaseStoreActions = BaseStoreActions,
>(
  initialState: InitialState<TState>,
  storeDefinition: StoreCreator<TState, TActions>,
  config: StoreConfig
) {
  const {
    name,
    persist: enablePersist = false,
    devtools: enableDevtools = true,
    immer: enableImmer = true,
    subscriptions = false,
  } = config

  // Store creator compatible avec Zustand
  const storeCreator = (set: unknown, get: unknown) => {
    const customActions = storeDefinition(
      set as Parameters<typeof storeDefinition>[0],
      get as Parameters<typeof storeDefinition>[1]
    )
    const baseActions = createBaseActions(initialState)

    return {
      ...initialState,
      ...customActions,
      // Mélanger les actions de base de manière sûre
      setLoading: baseActions.setLoading,
      setError: baseActions.setError,
      clearError: baseActions.clearError,
      reset: baseActions.reset,
    } as TState & TActions
  }

  let store = storeCreator

  // Middleware Immer pour mutations immutables
  if (enableImmer) {
    store = immer(store) as typeof store
  }

  // Middleware de persistence sécurisée
  if (enablePersist) {
    store = persist(store, {
      name: `${name}-storage`,
      storage: {
        getItem: (key: string) => {
          try {
            const item = localStorage.getItem(key)

            return item ? JSON.parse(item) : null
          } catch (_error) {
            return null
          }
        },
        setItem: (key: string, value: unknown) => {
          try {
            localStorage.setItem(key, JSON.stringify(value))
          } catch (_error) {}
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key)
          } catch (_error) {}
        },
      },
      partialize: (state: unknown) => {
        // Ne persister que les données importantes
        const {
          loading: _loading,
          error: _error,
          lastUpdate: _lastUpdate,
          ...persistedState
        } = state as Record<string, unknown>

        return persistedState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
        } else {
        }
      },
    }) as typeof store
  }

  // Middleware subscriptions si nécessaire
  if (subscriptions) {
    store = subscribeWithSelector(store) as typeof store
  }

  // Middleware DevTools
  if (enableDevtools && process.env.NODE_ENV === 'development') {
    store = devtools(store, { name }) as typeof store
  }

  const zustandStore = create<TState & TActions>()(store)

  // Monitoring des changements d'état
  if (process.env.NODE_ENV === 'development') {
    addMonitoring(zustandStore, name)
  }

  return zustandStore
}

/**
 * Actions de base communes à tous les stores
 */
export function createBaseActions<TState extends BaseStoreState>(
  initialState: InitialState<TState>
): BaseStoreActions {
  return {
    setLoading: (loading: boolean) => (state: TState) => {
      state.loading = loading
      state.lastUpdate = Date.now()
    },

    setError: (error: string | null) => (state: TState) => {
      state.error = error
      state.loading = false
      state.lastUpdate = Date.now()
    },

    clearError: () => (state: TState) => {
      state.error = null
      state.lastUpdate = Date.now()
    },

    reset: () => (state: TState) => {
      const preservedProps = {
        loading: false,
        error: null,
        lastUpdate: Date.now(),
      }

      Object.assign(state, {
        ...initialState,
        ...preservedProps,
      })
    },
  }
}

/**
 * Wrapper simplifié pour actions async - Version corrigée
 * Utilisation: à appeler directement dans les actions, pas dans la définition
 */
export async function wrapAsyncAction<TResult>(
  action: () => Promise<TResult>,
  onStart?: () => void,
  onSuccess?: (result: TResult) => void,
  onError?: (error: Error) => void
): Promise<TResult | null> {
  try {
    onStart?.()
    const result = await action()

    onSuccess?.(result)

    return result
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    onError?.(errorObj)

    return null
  }
}

/**
 * Cache simple et efficace avec TTL
 */
export function createCache<K, V>(ttlMs = 300000) {
  const cache = new Map<K, CacheItem<V>>()

  return {
    get: (key: K): V | null => {
      const item = cache.get(key)

      if (!item) return null

      if (Date.now() - item.timestamp > ttlMs) {
        cache.delete(key)

        return null
      }

      return item.data
    },

    set: (key: K, value: V): void => {
      cache.set(key, {
        data: value,
        timestamp: Date.now(),
      })
    },

    has: (key: K): boolean => {
      const item = cache.get(key)

      if (!item) return false

      if (Date.now() - item.timestamp > ttlMs) {
        cache.delete(key)

        return false
      }

      return true
    },

    delete: (key?: K): void => {
      if (key) {
        cache.delete(key)
      } else {
        cache.clear()
      }
    },

    size: () => cache.size,

    cleanup: (): number => {
      const now = Date.now()
      let deletedCount = 0

      for (const [key, item] of cache.entries()) {
        if (now - item.timestamp > ttlMs) {
          cache.delete(key)
          deletedCount++
        }
      }

      return deletedCount
    },
  }
}

/**
 * Validation d'état pour stores
 */
export function validateState<TState extends BaseStoreState>(
  state: Partial<TState>,
  schema: Record<keyof TState, (value: unknown) => boolean>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, validator] of Object.entries(schema)) {
    const value = state[key as keyof TState]

    if (value !== undefined && !validator(value)) {
      errors.push(`Validation échouée pour ${String(key)}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Debounce pour actions
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Throttle pour actions
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Monitoring et debugging des stores
 */
function addMonitoring(store: unknown, name: string) {
  const storeTyped = store as { getState: () => unknown; setState: (fn: unknown) => void }
  const originalGetState = storeTyped.getState
  const originalSetState = storeTyped.setState

  storeTyped.getState = () => {
    const state = originalGetState()

    StoreMonitor.logAccess(name, state)

    return state
  }

  storeTyped.setState = (updater: unknown) => {
    const prevState = originalGetState()
    const result = originalSetState(updater)
    const newState = originalGetState()

    StoreMonitor.logStateChange(name, 'setState', newState, prevState)

    return result
  }
}

/**
 * Utilitaires de sérialisation sécurisée
 */
export function safeSerialize(data: unknown): string | null {
  try {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === 'function') return undefined
      if (value instanceof Date) return value.toISOString()
      if (value instanceof Error) return { name: value.name, message: value.message }

      return value
    })
  } catch (_error) {
    return null
  }
}

/**
 * Utilitaires de désérialisation sécurisée
 */
export function safeDeserialize<T>(data: string): T | null {
  try {
    return JSON.parse(data, (_key, value) => {
      // Reconstituer les dates
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }

      return value
    })
  } catch (_error) {
    return null
  }
}

// ===== MONITORING ET DEBUG =====

// Store monitor as module-level functions
const storeMonitorSubscribers = new Set<(event: StoreEvent) => void>()
let storeMonitorEnabled = process.env.NODE_ENV === 'development'
const storeAccessLog = new Map<string, number>()

function enableStoreMonitor(enabled = true) {
  storeMonitorEnabled = enabled
}

function subscribeToStoreMonitor(callback: (event: StoreEvent) => void) {
  storeMonitorSubscribers.add(callback)

  return () => storeMonitorSubscribers.delete(callback)
}

function cloneStoreState(state: unknown) {
  try {
    return structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state))
  } catch {
    return { ...(state as Record<string, unknown>) }
  }
}

function logStoreStateChange(
  storeName: string,
  action: string,
  state: unknown,
  prevState?: unknown,
  startTime?: number
) {
  if (!storeMonitorEnabled) return

  const event: StoreEvent = {
    timestamp: Date.now(),
    store: storeName,
    action,
    state: cloneStoreState(state),
    prevState: prevState ? cloneStoreState(prevState) : undefined,
    duration: startTime ? Date.now() - startTime : undefined,
  }

  // Log console en développement
  if (process.env.NODE_ENV === 'development') {
    if (prevState) {
    }
    if (event.duration) {
    }
  }

  // Notifier les subscribers
  for (const callback of storeMonitorSubscribers) {
    try {
      callback(event)
    } catch (_error) {}
  }
}

function logStoreAccess(storeName: string, _state: unknown) {
  if (!storeMonitorEnabled) return

  const key = `${storeName}-access`
  const count = (storeAccessLog.get(key) || 0) + 1

  storeAccessLog.set(key, count)

  // Log périodique des accès
  if (count % 100 === 0) {
  }
}

function getStoreMonitorStats() {
  return {
    subscribers: storeMonitorSubscribers.size,
    accessCount: Array.from(storeAccessLog.entries()),
    isEnabled: storeMonitorEnabled,
    timestamp: Date.now(),
  }
}

function resetStoreMonitor() {
  storeAccessLog.clear()
  storeMonitorSubscribers.clear()
}

// Legacy export for backward compatibility
export const StoreMonitor = {
  enable: enableStoreMonitor,
  subscribe: subscribeToStoreMonitor,
  logStateChange: logStoreStateChange,
  logAccess: logStoreAccess,
  getStats: getStoreMonitorStats,
  reset: resetStoreMonitor,
}

// ===== EXPORTS UNIQUEMENT DES UTILITAIRES =====
export const StoreUtils = {
  createRobustStore,
  createBaseActions,
  wrapAsyncAction,
  createCache,
  validateState,
  debounce,
  throttle,
  safeSerialize,
  safeDeserialize,
}

export default StoreUtils
