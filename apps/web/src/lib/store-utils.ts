/**
 * 🛠️ STORE UTILITIES ROBUSTES - TopSteel ERP
 * Utilitaires complets pour création et gestion des stores Zustand
 * Version robuste avec gestion d'erreur avancée et monitoring
 * Fichier: apps/web/src/lib/store-utils.ts
 */
import type { AsyncActionConfig, BaseStoreState, StoreConfig } from '@erp/types'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ===== CLASSE PRINCIPALE DES UTILITAIRES =====
export class StoreUtils {
  private static readonly DEFAULT_VERSION = '1.0.0'
  private static readonly DEFAULT_RETRY_DELAY = 1000
  private static readonly MAX_RETRIES = 3

  /**
   * Créateur de store robuste avec middleware intégrés et gestion d'erreur
   */
  static createRobustStore<T extends BaseStoreState>(
    initialState: Omit<T, keyof BaseStoreState>,
    storeDefinition: (set: any, get: any) => T,
    config: StoreConfig
  ) {
    const {
      name,
      persist: enablePersist = false,
      devtools: enableDevtools = true,
      immer: enableImmer = true,
      subscriptions = false,
      version = this.DEFAULT_VERSION,
      migrations = {}
    } = config

    // État de base enrichi
    const baseState: BaseStoreState = {
      loading: false,
      error: null,
      lastUpdate: Date.now(),
      version
    }

    const fullInitialState = { ...baseState, ...initialState } as T

    let store = (set: any, get: any) => {
      const enhancedSet = this.createEnhancedSetter(set)
      const storeInstance = storeDefinition(enhancedSet, get)
      
      return {
        ...fullInitialState,
        ...storeInstance,
        // Actions de base intégrées
        ...this.createBaseActions<T>(enhancedSet, get)
      }
    }

    // Middleware Immer pour mutations immutables
    if (enableImmer) {
      store = immer(store) as any
    }

    // Middleware de persistence avec migrations
    if (enablePersist) {
      store = persist(store, {
        name: `topsteel-${name}-storage`,
        version: parseInt(version.split('.')[0]) || 1,
        migrate: (persistedState: any, version: number) => {
          let state = persistedState
          
          // Appliquer les migrations séquentiellement
          Object.keys(migrations)
            .map(Number)
            .filter(v => v > version)
            .sort((a, b) => a - b)
            .forEach(migrationVersion => {
              state = migrations[migrationVersion](state)
            })
          
          return state
        },
        storage: {
          getItem: (key: string) => {
            try {
              const item = localStorage.getItem(key)
              return item ? JSON.parse(item) : null
            } catch (error) {
              console.error(`Erreur lecture storage pour ${key}:`, error)
              return null
            }
          },
          setItem: (key: string, value: any) => {
            try {
              localStorage.setItem(key, JSON.stringify(value))
            } catch (error) {
              console.error(`Erreur écriture storage pour ${key}:`, error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.error(`Erreur suppression storage pour ${key}:`, error)
            }
          }
        },
        partialize: (state: any) => {
          // Exclure les données sensibles et temporaires
          const { loading, error, ...persistedState } = state
          return persistedState
        },
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error(`Erreur hydratation store ${name}:`, error)
          } else {
            console.log(`Store ${name} hydraté avec succès`)
          }
        }
      }) as any
    }

    // Middleware devtools avec configuration avancée
    if (enableDevtools) {
      store = devtools(store, {
        name: `TopSteel ERP - ${name}`,
        serialize: true,
        trace: true,
        traceLimit: 25
      }) as any
    }

    // Middleware de souscription pour monitoring
    if (subscriptions) {
      store = subscribeWithSelector(store) as any
    }

    return create(store)
  }

  /**
   * Créateur d'actions de base communes à tous les stores
   */
  static createBaseActions<T extends BaseStoreState>(set: any, get: any) {
    return {
      setLoading: (loading: boolean) => set((state: T) => {
        state.loading = loading
        state.lastUpdate = Date.now()
        if (!loading && state.error) {
          state.error = null // Clear error when loading ends successfully
        }
      }),

      setError: (error: string | null) => set((state: T) => {
        state.error = error
        state.loading = false
        state.lastUpdate = Date.now()
      }),

      clearError: () => set((state: T) => {
        state.error = null
        state.lastUpdate = Date.now()
      }),

      reset: () => set((state: T) => {
        // Reset to initial state while preserving version
        const currentVersion = state.version
        Object.keys(state).forEach(key => {
          if (key !== 'version') {
            delete (state as any)[key]
          }
        })
        Object.assign(state, {
          loading: false,
          error: null,
          lastUpdate: Date.now(),
          version: currentVersion
        })
      }),

      updateLastActivity: () => set((state: T) => {
        state.lastUpdate = Date.now()
      })
    }
  }

  /**
   * Créateur d'actions asynchrones avec retry et gestion d'erreur
   */
  static createAsyncAction<T extends BaseStoreState, Args extends any[], Result>(
    asyncFn: (...args: Args) => Promise<Result>,
    config: AsyncActionConfig<T, Result> = {}
  ) {
    const {
      onStart,
      onSuccess,
      onError,
      onFinally,
      retries = this.MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY
    } = config

    return async (...args: Args): Promise<Result | null> => {
      const executeWithRetry = async (attempt: number): Promise<Result> => {
        try {
          return await asyncFn(...args)
        } catch (error) {
          if (attempt < retries && this.isRetryableError(error)) {
            await this.delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
            return executeWithRetry(attempt + 1)
          }
          throw error
        }
      }

      return new Promise((resolve) => {
        // Utiliser un timeout pour éviter les deadlocks
        const timeoutId = setTimeout(() => {
          resolve(null)
        }, 30000) // 30 secondes timeout

        const execute = async () => {
          try {
            if (onStart) {
              onStart({} as T) // Cette fonction sera appelée via set() dans le store
            }

            const result = await executeWithRetry(0)
            
            if (onSuccess) {
              onSuccess({} as T, result)
            }

            clearTimeout(timeoutId)
            resolve(result)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
            
            if (onError) {
              onError({} as T, error as Error)
            }

            console.error('Erreur dans action asynchrone:', error)
            clearTimeout(timeoutId)
            resolve(null)
          } finally {
            if (onFinally) {
              onFinally({} as T)
            }
          }
        }

        execute()
      })
    }
  }

  /**
   * Créateur de setter enrichi avec logging et monitoring
   */
  private static createEnhancedSetter(originalSet: any) {
    return (updater: any) => {
      const startTime = performance.now()
      
      originalSet((state: any) => {
        const stateBefore = { ...state }
        
        if (typeof updater === 'function') {
          updater(state)
        } else {
          Object.assign(state, updater)
        }

        // Monitoring des performances
        const duration = performance.now() - startTime
        if (duration > 100) { // Warn si l'update prend plus de 100ms
          console.warn(`Update store lent (${duration.toFixed(2)}ms)`)
        }

        // Logging en développement
        if (process.env.NODE_ENV === 'development') {
          StoreMonitor.logStateChange('store', 'update', {
            before: stateBefore,
            after: { ...state },
            duration
          })
        }

        state.lastUpdate = Date.now()
      })
    }
  }

  /**
   * Vérifie si une erreur est "retry-able"
   */
  private static isRetryableError(error: any): boolean {
    if (!error) return false
    
    // Erreurs réseau
    if (error.name === 'NetworkError' || error.name === 'TypeError') return true
    
    // Codes d'erreur HTTP retry-ables
    if (error.status) {
      const retryableCodes = [408, 429, 500, 502, 503, 504]
      return retryableCodes.includes(error.status)
    }
    
    return false
  }

  /**
   * Utilitaire de délai pour les retry
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cache intelligent pour sélecteurs
   */
  static createSelectorCache<T>() {
    const cache = new Map<string, { value: T; timestamp: number; hitCount: number }>()
    
    return {
      get: (key: string): T | undefined => {
        const entry = cache.get(key)
        if (entry) {
          entry.hitCount++
          return entry.value
        }
        return undefined
      },

      set: (key: string, value: T): void => {
        cache.set(key, {
          value,
          timestamp: Date.now(),
          hitCount: 1
        })
        
        // Nettoyage automatique si trop d'entrées
        if (cache.size > 100) {
          const entries = Array.from(cache.entries())
          const sortedByUsage = entries.sort((a, b) => a[1].hitCount - b[1].hitCount)
          const toDelete = sortedByUsage.slice(0, 20)
          toDelete.forEach(([key]) => cache.delete(key))
        }
      },

      clear: (key?: string): void => {
        if (key) {
          cache.delete(key)
        } else {
          cache.clear()
        }
      },

      size: () => cache.size,

      stats: () => ({
        size: cache.size,
        entries: Array.from(cache.entries()).map(([key, value]) => ({
          key,
          hitCount: value.hitCount,
          age: Date.now() - value.timestamp
        }))
      })
    }
  }
}

// ===== MONITORING ET DEBUG =====
export class StoreMonitor {
  private static subscribers = new Set<(event: any) => void>()
  private static isEnabled = process.env.NODE_ENV === 'development'
  
  static subscribe(callback: (event: any) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  static logStateChange(storeName: string, action: string, data: any) {
    if (!this.isEnabled) return
    
    const event = {
      timestamp: Date.now(),
      store: storeName,
      action,
      data: structuredClone(data)
    }
    
    console.log(`🔄 [${storeName}] ${action}`, data)
    
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
          if (store && typeof store.getState === 'function') {
            data[name] = store.getState()
          }
        })
        return {
          ...data,
          timestamp: Date.now(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'unknown'
        }
      },
      
      import: (data: any) => {
        try {
          Object.entries(stores).forEach(([name, store]) => {
            if (data[name] && store && typeof store.setState === 'function') {
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

  static enable() {
    this.isEnabled = true
  }

  static disable() {
    this.isEnabled = false
  }
}

// ===== TYPES RÉEXPORTÉS DEPUIS @erp/types =====
// Tous les types sont maintenant centralisés dans @erp/types
// Pas d'exports locaux pour éviter les conflits