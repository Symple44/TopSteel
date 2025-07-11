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

export class StoreUtils {
  /**
   * Créateur de store robuste avec middleware intégrés
   */
  static createRobustStore<
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
      const customActions = storeDefinition(set, get)
      const baseActions = StoreUtils.createBaseActions(initialState)

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
      store = immer(store) as any
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
            } catch (error) {
              console.warn(`Erreur lecture storage pour ${key}:`, error)

              return null
            }
          },
          setItem: (key: string, value: unknown) => {
            try {
              localStorage.setItem(key, JSON.stringify(value))
            } catch (error) {
              console.warn(`Erreur écriture storage pour ${key}:`, error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.warn(`Erreur suppression storage pour ${key}:`, error)
            }
          },
        },
        partialize: (state: unknown) => {
          // Ne persister que les données importantes
          const { loading, error, lastUpdate, ...persistedState } = state

          return persistedState
        },
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(`Erreur réhydratation store ${name}:`, error)
          } else {
          }
        },
      }) as any
    }

    // Middleware subscriptions si nécessaire
    if (subscriptions) {
      store = subscribeWithSelector(store) as any
    }

    // Middleware DevTools
    if (enableDevtools && process.env.NODE_ENV === 'development') {
      store = devtools(store, { name }) as any
    }

    const zustandStore = create<TState & TActions>()(store)

    // Monitoring des changements d'état
    if (process.env.NODE_ENV === 'development') {
      StoreUtils.addMonitoring(zustandStore, name)
    }

    return zustandStore
  }

  /**
   * Actions de base communes à tous les stores
   */
  static createBaseActions<TState extends BaseStoreState>(
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
  static async wrapAsyncAction<TResult>(
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
  static createCache<K, V>(ttlMs = 300000) {
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
  static validateState<TState extends BaseStoreState>(
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
  static debounce<T extends (...args: unknown[]) => any>(
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
  static throttle<T extends (...args: unknown[]) => any>(
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
  private static addMonitoring(store: unknown, name: string) {
    const originalGetState = store.getState
    const originalSetState = store.setState

    store.getState = () => {
      const state = originalGetState()

      StoreMonitor.logAccess(name, state)

      return state
    }

    store.setState = (updater: unknown) => {
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
  static safeSerialize(data: unknown): string | null {
    try {
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'function') return undefined
        if (value instanceof Date) return value.toISOString()
        if (value instanceof Error) return { name: value.name, message: value.message }

        return value
      })
    } catch (error) {
      console.warn('Erreur lors de la sérialisation:', error)

      return null
    }
  }

  /**
   * Utilitaires de désérialisation sécurisée
   */
  static safeDeserialize<T>(data: string): T | null {
    try {
      return JSON.parse(data, (key, value) => {
        // Reconstituer les dates
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }

        return value
      })
    } catch (error) {
      console.warn('Erreur lors de la désérialisation:', error)

      return null
    }
  }
}

// ===== MONITORING ET DEBUG =====

export class StoreMonitor {
  private static subscribers = new Set<(event: StoreEvent) => void>()
  private static isEnabled = process.env.NODE_ENV === 'development'
  private static accessLog = new Map<string, number>()

  static enable(enabled = true) {
    StoreMonitor.isEnabled = enabled
  }

  static subscribe(callback: (event: StoreEvent) => void) {
    StoreMonitor.subscribers.add(callback)

    return () => StoreMonitor.subscribers.delete(callback)
  }

  static logStateChange(
    storeName: string,
    action: string,
    state: unknown,
    prevState?: unknown,
    startTime?: number
  ) {
    if (!StoreMonitor.isEnabled) return

    const event: StoreEvent = {
      timestamp: Date.now(),
      store: storeName,
      action,
      state: StoreMonitor.cloneState(state),
      prevState: prevState ? StoreMonitor.cloneState(prevState) : undefined,
      duration: startTime ? Date.now() - startTime : undefined,
    }

    // Log console en développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 [${storeName}] ${action}`)
      if (prevState) {
      }
      if (event.duration) {
      }
      console.groupEnd()
    }

    // Notifier les subscribers
    StoreMonitor.subscribers.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erreur dans subscriber du monitor:', error)
      }
    })
  }

  static logAccess(storeName: string, state: unknown) {
    if (!StoreMonitor.isEnabled) return

    const key = `${storeName}-access`
    const count = (StoreMonitor.accessLog.get(key) || 0) + 1

    StoreMonitor.accessLog.set(key, count)

    // Log périodique des accès
    if (count % 100 === 0) {
    }
  }

  private static cloneState(state: unknown) {
    try {
      return structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state))
    } catch {
      return { ...state }
    }
  }

  static getStats() {
    return {
      subscribers: StoreMonitor.subscribers.size,
      accessCount: Array.from(StoreMonitor.accessLog.entries()),
      isEnabled: StoreMonitor.isEnabled,
      timestamp: Date.now(),
    }
  }

  static reset() {
    StoreMonitor.accessLog.clear()
    StoreMonitor.subscribers.clear()
  }
}

// ===== EXPORTS UNIQUEMENT DES CLASSES UTILITAIRES =====
export default StoreUtils
