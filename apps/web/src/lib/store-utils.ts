// apps/web/src/lib/store-utils.ts
import type { StateCreator } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

/**
 * Crée un store Zustand avec persistance et devtools
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
    skipHydration: false,
  }
  
  return devtools(
    persist(
      immer(stateCreator),
      persistConfig
    ),
    { name: `TopSteel-${name}` }
  )
}

/**
 * Crée un store Zustand simple (sans persistance)
 */
export const createSimpleStore = <T>(
  stateCreator: StateCreator<T, [['zustand/immer', never]], [], T>,
  name: string
) => {
  return devtools(
    immer(stateCreator),
    { name: `TopSteel-${name}` }
  )
}

/**
 * Utilitaire pour générer des IDs uniques
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}