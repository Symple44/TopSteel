// apps/web/src/lib/store-utils.ts - VERSION ENTERPRISE SSR-SAFE
import type { StateCreator } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ID } from './id-system'

/**
 * ✅ STORE ENTERPRISE AVEC PERSISTANCE SSR-SAFE
 * 
 * Améliorations:
 * - Configuration SSR robuste
 * - IDs crypto sécurisés
 * - Monitoring et métriques
 * - Gestion d'erreurs avancée
 * - Versioning automatique
 */
export const createStoreWithPersist = <T>(
  stateCreator: StateCreator<T, [['zustand/immer', never]], [], T>,
  name: string,
  persistedKeys?: (keyof T)[],
  version = 1
) => {
  const persistConfig = {
    name: `topsteel-${name}`,
    version,
    
    // ✅ PARTIALISATION INTELLIGENTE
    partialize: persistedKeys 
      ? (state: T) => {
          const result = { /* TODO: Implémenter */ } as Partial<T>
          persistedKeys.forEach(key => {
            if (state[key] !== undefined) {
              result[key] = state[key]
            }
          })
          return result
        }
      : undefined,
    
    // ✅ CONFIGURATION SSR ENTERPRISE
    skipHydration: true,
    
    // ✅ STORAGE WRAPPER ROBUSTE
    storage: {
      getItem: (name: string) => {
        if (typeof window === 'undefined') return null
        
        try {
          const item = localStorage.getItem(name)
          if (!item) return null
          
          // ✅ Validation JSON
          const parsed = JSON.parse(item)
          
          // ✅ Vérification version
          if (parsed.version !== version) {
            console.info(`Store ${name}: version mismatch, clearing...`)
            localStorage.removeItem(name)
            return null
          }
          
          return item
        } catch (error) {
          console.warn(`Store ${name}: failed to get item`, error)
          // ✅ Nettoyage automatique des données corrompues
          try {
            localStorage.removeItem(name)
          } catch { /* TODO: Implémenter */ }
          return null
        }
      },
      
      setItem: (name: string, value: string) => {
        if (typeof window === 'undefined') return
        
        try {
          // ✅ Validation taille (localStorage limit ~5MB)
          if (value.length > 4 * 1024 * 1024) { // 4MB limit
            console.warn(`Store ${name}: data too large, skipping persist`)
            return
          }
          
          localStorage.setItem(name, value)
          
          // ✅ Métriques de performance
          if (process.env.NODE_ENV === 'development') {
            const size = new Blob([value]).size
            console.debug(`Store ${name}: persisted ${size} bytes`)
          }
        } catch (error) {
          console.warn(`Store ${name}: failed to persist`, error)
          
          // ✅ Tentative de nettoyage en cas d'espace insuffisant
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            try {
              // Nettoyer les anciens stores si nécessaire
              this.cleanup()
            } catch { /* TODO: Implémenter */ }
          }
        }
      },
      
      removeItem: (name: string) => {
        if (typeof window === 'undefined') return
        
        try {
          localStorage.removeItem(name)
        } catch (error) {
          console.warn(`Store ${name}: failed to remove`, error)
        }
      },
      
      // ✅ Méthode de nettoyage
      cleanup: () => {
        if (typeof window === 'undefined') return
        
        try {
          // Identifier les clés TopSteel anciennes
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('topsteel-') && key !== `topsteel-${name}`) {
              try {
                const item = localStorage.getItem(key)
                if (item) {
                  const parsed = JSON.parse(item)
                  // Supprimer si version ancienne
                  if (parsed.version < version) {
                    keysToRemove.push(key)
                  }
                }
              } catch { /* TODO: Implémenter */ }
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key))
          console.info(`Cleaned ${keysToRemove.length} old store entries`)
        } catch (error) {
          console.warn('Store cleanup failed:', error)
        }
      }
    },
    
    // ✅ MIGRATION AUTOMATIQUE
    migrate: (persistedState: any, version: number) => {
      // Migration personnalisée par store si nécessaire
      console.info(`Store ${name}: migrating from version ${version}`)
      
      // Exemple de migration
      if (version === 0) {
        // Migrer de l'ancienne structure
        return {
          ...persistedState,
          version: 1,
          migrated: true,
          migratedAt: Date.now()
        }
      }
      
      return persistedState
    },
    
    // ✅ CALLBACKS DE CYCLE DE VIE
    onRehydrateStorage: (name: string) => {
      console.debug(`Store ${name}: starting rehydration`)
      
      return (state: any, error: any) => {
        if (error) {
          console.error(`Store ${name}: rehydration failed`, error)
          // Métriques d'erreur si configurées
          if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('store_rehydration_error', {
              store: name,
              error: error.message
            })
          }
        } else {
          console.debug(`Store ${name}: rehydration completed`)
        }
      }
    }
  }
  
  return devtools(
    persist(
      immer(stateCreator),
      persistConfig
    ),
    { 
      name: `TopSteel-${name}`,
      enabled: process.env.NODE_ENV === 'development',
      
      // ✅ CONFIGURATION DEVTOOLS AVANCÉE
      serialize: process.env.NODE_ENV === 'development' ? {
        date: true,
        regex: true,
        undefined: true,
        error: true,
        symbol: false,
        map: false,
        set: false
      } : false,
      
      // ✅ ACTIONS TRACKING
      trace: process.env.NODE_ENV === 'development',
      traceLimit: 25
    }
  )
}

/**
 * ✅ STORE SIMPLE ENTERPRISE (sans persistance)
 */
export const createSimpleStore = <T>(
  stateCreator: StateCreator<T, [['zustand/immer', never]], [], T>,
  name: string
) => {
  return devtools(
    immer(stateCreator),
    { 
      name: `TopSteel-${name}`,
      enabled: process.env.NODE_ENV === 'development',
      serialize: process.env.NODE_ENV === 'development'
    }
  )
}

/**
 * ✅ UTILITAIRES ID ENTERPRISE (compatibilité legacy)
 */
export const generateId = (): string => {
  console.warn('generateId() is deprecated. Use ID.simple() from id-system.ts')
  return ID.simple()
}

export const generateIdWithPrefix = (prefix: string): string => {
  console.warn('generateIdWithPrefix() is deprecated. Use ID.business() from id-system.ts')
  return `${prefix}-${ID.simple()}`
}

/**
 * ✅ MONITORING ET MÉTRIQUES
 */
export const StoreMonitor = {
  /**
   * Mesurer performance d'une action store
   */
  measureAction: <T extends (...args: any[]) => any>(
    storeName: string,
    actionName: string,
    action: T
  ): T => {
    return ((...args: any[]) => {
      const start = performance.now()
      const result = action(...args)
      const duration = performance.now() - start
      
      if (duration > 16) { // > 1 frame
        console.warn(`Store ${storeName}.${actionName} took ${duration.toFixed(2)}ms`)
      }
      
      // Métriques vers analytics si configuré
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('store_action_performance', {
          store: storeName,
          action: actionName,
          duration: Math.round(duration),
          args: args.length
        })
      }
      
      return result
    }) as T
  },

  /**
   * Diagnostics store
   */
  diagnose: (storeName: string) => {
    if (typeof window === 'undefined') return null
    
    const storeKey = `topsteel-${storeName}`
    const data = localStorage.getItem(storeKey)
    
    if (!data) {
      return { exists: false }
    }
    
    try {
      const parsed = JSON.parse(data)
      const size = new Blob([data]).size
      
      return {
        exists: true,
        size,
        version: parsed.version,
        state: parsed.state,
        lastModified: new Date(parsed.state?.lastModified || Date.now())
      }
    } catch (error) {
      return {
        exists: true,
        corrupted: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
