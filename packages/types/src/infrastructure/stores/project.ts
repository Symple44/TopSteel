/**
 * 🏪 PROJECT STORE TYPES - TopSteel ERP
 * Types pour le store des projets
 * Fichier: packages/types/src/infrastructure/stores/project.ts
 */

import type { BaseStoreActions, BaseStoreState } from './base'
import type { StoreProjet, StoreProjetFilters, StoreProjetStats } from './entities'

// ===== TYPES POUR PROJET STORE =====

/**
 * Statistiques des projets (alias vers StoreProjetStats)
 */
export type ProjetStats = StoreProjetStats

/**
 * État du store projets
 */
export interface ProjetState extends BaseStoreState {
  projets: StoreProjet[]
  selectedProjet: StoreProjet | null
  filters: StoreProjetFilters
  searchTerm: string
  sortBy: keyof StoreProjet
  sortOrder: 'asc' | 'desc'
  currentPage: number
  pageSize: number
  totalCount: number
  lastFetch: number
  cacheTTL: number
  isSyncing: boolean
  stats: ProjetStats | null
}

/**
 * Actions du store projets
 */
export interface ProjetStoreActions extends BaseStoreActions {
  // Actions de données
  fetchProjets: (options?: { force?: boolean; filters?: StoreProjetFilters }) => Promise<
    StoreProjet[]
  >
  createProjet: (
    projet: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<StoreProjet | null>
  updateProjet: (id: string, updates: Partial<StoreProjet>) => Promise<StoreProjet | null>
  deleteProjet: (id: string) => Promise<boolean>
  duplicateProjet: (id: string) => Promise<StoreProjet | null>

  // Actions de sélection
  setSelectedProjet: (projet: StoreProjet | null) => void
  selectProjetById: (id: string) => void

  // Actions de filtrage
  setFilters: (filters: Partial<StoreProjetFilters>) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void

  // Actions de tri et pagination
  setSorting: (sortBy: keyof StoreProjet, sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void

  // Actions de cache
  invalidateCache: () => void
  refreshStats: () => Promise<void>
}

/**
 * Store complet des projets
 */
export type ProjetStore = ProjetState & ProjetStoreActions
