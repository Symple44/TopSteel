/**
 * 🏪 TYPES DE BASE STORES - TopSteel ERP
 * Types fondamentaux pour tous les stores Zustand
 * Fichier: packages/types/src/infrastructure/stores/base.ts
 */

// ===== TYPES DE BASE POUR STORES =====

/**
 * État de base commun à tous les stores
 */
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdate: number
}

/**
 * Configuration pour la création des stores
 */
export interface StoreConfig {
  name: string
  persist?: boolean
  devtools?: boolean
  immer?: boolean
  subscriptions?: boolean
}

/**
 * Actions de base communes à tous les stores
 */
export interface BaseStoreActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

/**
 * Type générique pour créateur de store
 * Sépare les données (TState) des actions (TActions)
 */
export type StoreCreator<TState extends BaseStoreState, TActions = {}> = (
  set: (fn: (state: TState & TActions) => void) => void,
  get: () => TState & TActions
) => TActions

/**
 * Type pour l'état initial d'un store
 */
export type InitialState<T extends BaseStoreState> = Omit<T, keyof BaseStoreActions>

/**
 * Type pour la définition d'un store
 */
export type StoreDefinition<TState extends BaseStoreState, TActions> = StoreCreator<
  TState,
  TActions
>

/**
 * Extracteur du state d'un store
 */
export type ExtractState<T> = T extends infer U & BaseStoreActions
  ? Omit<U, keyof BaseStoreActions>
  : never

/**
 * Extracteur des actions d'un store
 */
export type ExtractActions<T> = T extends infer U & BaseStoreState
  ? Omit<U, keyof BaseStoreState>
  : never
