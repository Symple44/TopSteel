/**
 * 🛠️ STORE UTILITIES - TopSteel ERP
 * Utilitaires robustes pour création et gestion des stores Zustand
 * Fichier: apps/web/src/lib/store-utils.ts
 */
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ===== TYPES GÉNÉRIQUES =====
interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdate: number
}

interface StoreConfig {
  name: string
  persist?: boolean
  devtools?: boolean
  immer?: boolean
  subscriptions?: boolean
}

// ===== UTILITAIRES POUR STORES =====
export class StoreUtils {
  /**
   * Créateur de store robuste avec middleware intégrés
   */
  static createRobustStore<T extends BaseStoreState>(
    initialState: T,
    storeDefinition: (set: any, get: any) => T,
    config: StoreConfig
  ) {
    const { name, persist: enablePersist = false, devtools: enableDevtools = true, immer: enableImmer = true, subscriptions = false } = config

    let store = storeDefinition

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
          const { loading, error, ...persistedState } = state
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

    return create<T>()(store)
  }

  /**
   * Actions de base communes à tous les stores
   */
  static createBaseActions<T extends BaseStoreState>() {
    return {
      setLoading: (loading: boolean) => (state: T) => {
        state.loading = loading
        state.lastUpdate = Date.now()
      },
      
      setError: (error: string | null) => (state: T) => {
        state.error = error
        state.loading = false
        state.lastUpdate = Date.now()
      },
      
      clearError: () => (state: T) => {
        state.error = null
        state.lastUpdate = Date.now()
      },
      
      reset: (initialState: Partial<T>) => () => ({
        ...initialState,
        loading: false,
        error: null,
        lastUpdate: Date.now()
      } as T)
    }
  }

  /**
   * Wrapper pour actions async avec gestion d'erreur
   */
  static createAsyncAction<T extends BaseStoreState, Args extends any[], Result>(
    action: (...args: Args) => Promise<Result>,
    options: {
      onStart?: (state: T) => void
      onSuccess?: (state: T, result: Result) => void
      onError?: (state: T, error: Error) => void
    } = {}
  ) {
    const { onStart, onSuccess, onError } = options

    return async (set: (fn: (state: T) => void) => void, get: () => T, ...args: Args): Promise<Result | null> => {
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
   * Cache avec TTL pour les stores
   */
  static createStoreCache<K, V>(ttl: number = 300000) {
    const cache = new Map<K, { data: V; timestamp: number }>()

    return {
      get: (key: K): V | null => {
        const entry = cache.get(key)
        if (!entry) return null

        const now = Date.now()
        if (now - entry.timestamp > ttl) {
          cache.delete(key)
          return null
        }

        return entry.data
      },

      set: (key: K, data: V): void => {
        cache.set(key, { data, timestamp: Date.now() })
      },

      invalidate: (key?: K): void => {
        if (key) {
          cache.delete(key)
        } else {
          cache.clear()
        }
      },

      size: () => cache.size
    }
  }
}

// ===== MONITORING ET DEBUG =====
export class StoreMonitor {
  private static subscribers = new Set<(event: any) => void>()
  
  static subscribe(callback: (event: any) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  static logStateChange(storeName: string, action: string, state: any) {
    const event = {
      timestamp: Date.now(),
      store: storeName,
      action,
      state: structuredClone(state)
    }
    
    console.log(`🔄 [${storeName}] ${action}`, state)
    
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erreur dans subscriber du monitor:', error)
      }
    })
  }
  
  static createStoreExporter(stores: Record<string, any>) {
    return {
      export: () => {
        const data: Record<string, any> = {}
        Object.entries(stores).forEach(([name, store]) => {
          data[name] = store.getState()
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
            if (data[name]) {
              store.setState(data[name])
            }
          })
          console.log('État des stores importé avec succès')
        } catch (error) {
          console.error('Erreur lors de l\'import des stores:', error)
        }
      }
    }
  }
}

// ===== TYPES EXPORTÉS =====
export type { BaseStoreState, StoreConfig }
