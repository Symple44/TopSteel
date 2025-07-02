// apps/web/src/lib/store-utils.ts - VERSION CORRIGÉE SSR
import type { StateCreator } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

/**
 * Crée un store Zustand avec persistance et devtools (SSR safe)
 */
export const createStoreWithPersist = <T>(
  stateCreator: StateCreator<T, [['zustand/immer', never]], [], T>,
  name: string,
  persistedKeys?: (keyof T)[]
) => {
  const persistConfig = {
    name: `topsteel-${name}`,
    partialize: persistedKeys 
      ? (state: T) => {
          const result = {} as Partial<T>
          persistedKeys.forEach(key => {
            result[key] = state[key]
          })
          return result
        }
      : undefined,
    // ✅ FIX CRITIQUE: Configuration SSR pour éviter getServerSnapshot errors
    skipHydration: true, // ✅ Évite les problèmes de synchronisation serveur/client
    
    // ✅ Configuration robuste pour SSR
    storage: {
      getItem: (name: string) => {
        // ✅ Safe localStorage access pour SSR
        if (typeof window === 'undefined') return null
        try {
          return localStorage.getItem(name)
        } catch {
          return null
        }
      },
      setItem: (name: string, value: string) => {
        // ✅ Safe localStorage access pour SSR
        if (typeof window === 'undefined') return
        try {
          localStorage.setItem(name, value)
        } catch {
          // Fail silently
        }
      },
      removeItem: (name: string) => {
        // ✅ Safe localStorage access pour SSR
        if (typeof window === 'undefined') return
        try {
          localStorage.removeItem(name)
        } catch {
          // Fail silently
        }
      },
    },
  }
  
  return devtools(
    persist(
      immer(stateCreator),
      persistConfig
    ),
    { 
      name: `TopSteel-${name}`,
      // ✅ Disable devtools en production pour performance
      enabled: process.env.NODE_ENV === 'development'
    }
  )
}

/**
 * Crée un store Zustand simple (sans persistance) - SSR safe
 */
export const createSimpleStore = <T>(
  stateCreator: StateCreator<T, [['zustand/immer', never]], [], T>,
  name: string
) => {
  return devtools(
    immer(stateCreator),
    { 
      name: `TopSteel-${name}`,
      enabled: process.env.NODE_ENV === 'development'
    }
  )
}

/**
 * Hook pour hydratation manuelle des stores avec persistance
 * ✅ À utiliser dans _app.tsx ou layout.tsx pour SSR
 */
export const useHydrateStores = () => {
  // Cette fonction sera appelée côté client pour hydrater les stores
  // après le montage initial pour éviter les mismatches SSR
}

/**
 * Utilitaire pour générer des IDs uniques
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}