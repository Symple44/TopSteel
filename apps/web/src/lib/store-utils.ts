/**
 * 🛠️ STORE UTILITIES ROBUSTES - TopSteel ERP
 * Utilitaires pour création et gestion des stores Zustand avec types stricts
 * Fichier: apps/web/src/lib/store-utils.ts
 */

import type {
  BaseStoreActions,
  BaseStoreState,
  InitialState,
  StoreConfig,
  StoreCreator
} from '@erp/types'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ===== CLASSE PRINCIPALE STORE UTILS =====

export class StoreUtils {
  /**
   * Créateur de store robuste avec middleware intégrés
   * Signature corrigée pour compatibilité TypeScript/Zustand
   */
  static createRobustStore<
    TState extends BaseStoreState,
    TActions extends BaseStoreActions = BaseStoreActions
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
      subscriptions = false 
    } = config

    // Store creator compatible avec Zustand
    const storeCreator = (set: any, get: any) => {
      const actions = storeDefinition(set, get)
      return {
        ...initialState,
        ...actions
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
          setItem: (key: string, value: any) => {
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
          }
        },
        partialize: (state: any) => {
          // Ne persister que les données importantes, pas les erreurs/loading
          const { loading, error, lastUpdate, ...persistedState } = state
          return persistedState
        },
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(`Erreur réhydratation store ${name}:`, error)
          } else {
            console.log(`Store ${name} réhydraté avec succès`)
          }
        }
      }) as any
    }

    // Middleware subscriptions si nécessaire
    if (subscriptions) {
      store = subscribeWithSelector(store) as any
    }

    // Middleware DevTools
    if (enableDevtools) {
      store = devtools(store, { name }) as any
    }

    return create<TState & TActions>()(store)
  }

  /**
   * Actions de base communes à tous les stores
   * Version améliorée avec meilleur typage
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
        Object.assign(state, {
          ...initialState,
          loading: false,
          error: null,
          lastUpdate: Date.now()
        })
      }
    }
  }

  /**
   * Wrapper pour actions async avec gestion d'erreur robuste
   */
  static createAsyncAction<
    TState extends BaseStoreState,
    TArgs extends any[],
    TResult
  >(
    action: (...args: TArgs) => Promise<TResult>,
    options: {
      onStart?: (state: TState) => void
      onSuccess?: (state: TState, result: TResult) => void
      onError?: (state: TState, error: Error) => void
    } = {}
  ) {
    const { onStart, onSuccess, onError } = options

    return async (
      set: (fn: (state: TState) => void) => void,
      get: () => TState,
      ...args: TArgs
    ): Promise<TResult | null> => {
      try {
        set((state) => {
          state.loading = true
          state.error = null
          onStart?.(state)
        })

        const result = await action(...args)

        set((state) => {
          state.loading = false
          state.lastUpdate = Date.now()
          onSuccess?.(state, result)
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        
        set((state) => {
          state.loading = false
          state.error = errorMessage
          state.lastUpdate = Date.now()
          onError?.(state, error as Error)
        })

        console.error('Erreur dans action async:', error)
        return null
      }
    }
  }

  /**
   * Sélecteur optimisé avec mémoization
   */
  static createSelector<TState, TResult>(
    selector: (state: TState) => TResult,
    equalityFn?: (a: TResult, b: TResult) => boolean
  ) {
    let lastResult: TResult
    let lastState: TState

    return (state: TState): TResult => {
      if (state !== lastState) {
        const newResult = selector(state)
        
        if (!equalityFn) {
          lastResult = newResult
        } else if (!equalityFn(lastResult, newResult)) {
          lastResult = newResult
        }
        
        lastState = state
      }
      
      return lastResult
    }
  }

  /**
   * Cache simple pour stores avec TTL
   */
  static createCache<K extends string | number, V>(ttlMs = 300000) { // 5 minutes par défaut
    const cache = new Map<K, { value: V; timestamp: number }>()

    return {
      get: (key: K): V | null => {
        const item = cache.get(key)
        if (!item) return null

        if (Date.now() - item.timestamp > ttlMs) {
          cache.delete(key)
          return null
        }

        return item.value
      },

      set: (key: K, value: V): void => {
        cache.set(key, {
          value,
          timestamp: Date.now()
        })
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
      }
    }
  }

  /**
   * Validation d'état pour stores
   */
  static validateState<TState extends BaseStoreState>(
    state: Partial<TState>,
    schema: Record<keyof TState, (value: any) => boolean>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const [key, validator] of Object.entries(schema)) {
      const value = state[key as keyof TState]
      if (value !== undefined && !validator(value)) {
        errors.push(`Validation échouée pour ${key}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Debounce pour actions
   */
  static debounce<T extends (...args: any[]) => any>(
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
  static throttle<T extends (...args: any[]) => any>(
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
}

//===== MONITORING ET DEBUG =====

interface StoreEvent {
  timestamp: number
  store: string
  action: string
  state: any
  prevState?: any
  duration?: number
}

export class StoreMonitor {
  private static subscribers = new Set<(event: StoreEvent) => void>()
  private static isEnabled = process.env.NODE_ENV === 'development'

  static enable(enabled = true) {
    this.isEnabled = enabled
  }

  static subscribe(callback: (event: StoreEvent) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  static logStateChange(
    storeName: string, 
    action: string, 
    state: any, 
    prevState?: any,
    startTime?: number
  ) {
    if (!this.isEnabled) return

    const event: StoreEvent = {
      timestamp: Date.now(),
      store: storeName,
      action,
      state: this.cloneState(state),
      prevState: prevState ? this.cloneState(prevState) : undefined,
      duration: startTime ? Date.now() - startTime : undefined
    }

    // Log console en développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 [${storeName}] ${action}`)
      console.log('Nouvel état:', state)
      if (prevState) {
        console.log('État précédent:', prevState)
      }
      if (event.duration) {
        console.log(`Durée: ${event.duration}ms`)
      }
      console.groupEnd()
    }

    // Notifier les subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erreur dans subscriber du monitor:', error)
      }
    })
  }

  private static cloneState(state: any) {
    try {
      return structuredClone(state)
    } catch {
      // Fallback pour les objets non clonables
      return JSON.parse(JSON.stringify(state))
    }
  }

  static createStoreExporter(stores: Record<string, any>) {
    return {
      export: () => {
        const data: Record<string, any> = {}
        Object.entries(stores).forEach(([name, store]) => {
          try {
            data[name] = store.getState()
          } catch (error) {
            console.warn(`Impossible d'exporter le store ${name}:`, error)
          }
        })
        return {
          ...data,
          timestamp: Date.now(),
          version: '1.0.0'
        }
      },

      import: (data: any) => {
        try {
          Object.entries(stores).forEach(([name, store]) => {
            if (data[name] && typeof store.setState === 'function') {
              store.setState(data[name])
            }
          })
          console.log('État des stores importé avec succès')
          return true
        } catch (error) {
          console.error('Erreur lors de l\'import des stores:', error)
          return false
        }
      }
    }
  }

  static getPerformanceStats() {
    const performance = {
      storeCount: this.subscribers.size,
      memoryUsage: process.memoryUsage?.() || null,
      timestamp: Date.now()
    }
    
    return performance
  }
}

// ===== EXPORTS =====
export default StoreUtils