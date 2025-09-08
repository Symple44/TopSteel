/**
 * 📋 STORE PROJETS CORRIGÉ - TopSteel ERP
 * Store projets avec actions async directes (sans createAsyncAction)
 * Fichier: apps/web/src/stores/projet.store.ts
 */

import crypto from 'node:crypto'
import type {
  InitialState,
  ProjetState,
  ProjetStats,
  ProjetStore,
  ProjetStoreActions,
  StoreProjet,
  StoreProjetFilters,
} from '@erp/types'
import { ProjetPriorite, ProjetStatut, ProjetType } from '@erp/types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { StoreUtils } from '@/lib/store-utils'

// ===== ÉTAT INITIAL =====

const initialProjetState: InitialState<ProjetState> = {
  // État de base
  loading: false,
  error: null,
  lastUpdate: Date.now(),

  // Données
  projets: [],
  selectedProjet: null,

  // Filtres et recherche
  filters: {},
  searchTerm: '',
  sortBy: 'reference',
  sortOrder: 'desc',

  // Pagination
  currentPage: 1,
  pageSize: 20,
  totalCount: 0,

  // Cache et métadonnées
  lastFetch: 0,
  cacheTTL: 300000, // 5 minutes
  isSyncing: false,

  // Statistiques
  stats: null,
}

// ===== CACHE ET UTILITAIRES =====

const _projetCache = StoreUtils.createCache<string, StoreProjet[]>(300000) // 5 minutes
const _statsCache = StoreUtils.createCache<string, ProjetStats>(60000) // 1 minute

// ===== UTILITY FUNCTIONS FOR COMPLEXITY REDUCTION =====

/**
 * Check if cached projets should be used
 */
const shouldUseCachedProjets = (state: ProjetState, force: boolean): boolean => {
  if (force || !state?.projets?.length) {
    return false
  }

  const timeSinceLastFetch = Date.now() - state.lastFetch
  return timeSinceLastFetch < (state?.cacheTTL || 300000)
}

/**
 * Execute async action with common error handling and loading states
 */
const executeAsyncAction = async <T>(
  action: () => Promise<T>,
  set: unknown,
  useLoadingState: boolean = true
): Promise<T> => {
  if (useLoadingState) {
    set((state: ProjetState & ProjetStoreActions) => {
      state.loading = true
      state.error = null
    })
  }

  try {
    const result = await action()

    if (useLoadingState) {
      set((state: ProjetState & ProjetStoreActions) => {
        state.loading = false
      })
    }

    return result
  } catch (error) {
    set((state: ProjetState & ProjetStoreActions) => {
      state.loading = false
      state.error = error instanceof Error ? error.message : 'Erreur inconnue'
    })
    throw error
  }
}

/**
 * Update projet in state array
 */
const updateProjetInState = (state: ProjetState, id: string, updatedProjet: StoreProjet): void => {
  const index = state?.projets?.findIndex((p) => p.id === id)
  if (index !== -1 && state.projets && index !== undefined && index >= 0) {
    state.projets[index] = updatedProjet
  }
}

// ===== SERVICE API SIMULÉ =====

const projetService = {
  async fetchProjets(_filters?: StoreProjetFilters): Promise<StoreProjet[]> {
    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Retourner des données mockées
    return [
      {
        id: 'proj_001',
        reference: 'PRJ-2024-001',
        description: 'Portail résidentiel en acier',
        type: ProjetType.STANDARD,
        statut: ProjetStatut.EN_COURS,
        priorite: ProjetPriorite.NORMALE,
        dateCreation: new Date('2024-01-15'),
        dateDebut: new Date('2024-01-20'),
        dateFin: new Date('2024-02-15'),
        dateFinPrevue: new Date('2024-02-15'),
        clientId: 'client_001',
        client: {
          id: 'client_001',
          nom: 'Dupont',
          email: 'dupont@example.com',
          type: 'PARTICULIER',
        },
        montantHT: 5000,
        montantTTC: 6000,
        tauxTVA: 20,
        marge: 1000,
        avancement: 45,
        adresseChantier: {
          rue: '123 Rue de la Paix',
          ville: 'Paris',
          codePostal: '75001',
          pays: 'France',
        },
        documentsIds: [],
        ordresFabricationIds: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
      },
      {
        id: 'proj_002',
        reference: 'PRJ-2024-002',
        description: 'Escalier métallique industriel',
        type: ProjetType.INSTALLATION,
        statut: ProjetStatut.DEVIS,
        priorite: ProjetPriorite.HAUTE,
        dateCreation: new Date('2024-01-20'),
        dateDebut: new Date('2024-02-01'),
        dateFin: new Date('2024-03-01'),
        dateFinPrevue: new Date('2024-03-01'),
        clientId: 'client_002',
        client: {
          id: 'client_002',
          nom: 'SARL Industrielle',
          email: 'contact@sarl-industrielle.com',
          type: 'PROFESSIONNEL',
        },
        montantHT: 12000,
        montantTTC: 14400,
        tauxTVA: 20,
        marge: 2000,
        avancement: 0,
        adresseChantier: {
          rue: '456 Zone Industrielle',
          ville: 'Lyon',
          codePostal: '69000',
          pays: 'France',
        },
        documentsIds: [],
        ordresFabricationIds: [],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
      },
    ]
  },

  async fetchProjetById(id: string): Promise<StoreProjet | null> {
    const projets = await this?.fetchProjets()
    return projets?.find((p) => p.id === id) || null
  },

  async createProjet(
    projetData: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StoreProjet | null> {
    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 300))

    const newProjet: StoreProjet = {
      id: `proj_${Date.now()}`,
      ...projetData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return newProjet
  },

  async updateProjet(id: string, updates: Partial<StoreProjet>): Promise<StoreProjet | null> {
    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 300))

    const existingProjet = await this?.fetchProjetById(id)
    if (!existingProjet) return null

    const updatedProjet: StoreProjet = {
      ...existingProjet,
      ...updates,
      updatedAt: new Date(),
    }

    return updatedProjet
  },

  async deleteProjet(_id: string): Promise<boolean> {
    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 300))
    return true
  },

  async getProjetStats(): Promise<ProjetStats> {
    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 200))

    return {
      total: 42,
      enCours: 15,
      termines: 25,
      enRetard: 2,
      chiffreAffaireMois: 45000,
      margeGlobale: 8500,
      tauxReussite: 0.95,
      tempsMovenRealisation: 21,
    }
  },
}

// ===== STORE PRINCIPAL =====

export const useProjetStore = create<ProjetState & ProjetStoreActions>()(
  devtools(
    immer((set, get) => ({
      ...initialProjetState,

      // ===== ACTIONS =====

      // Chargement des projets (reduced complexity from ~8 to ~4)
      loadProjets: async (options?: { force?: boolean; filters?: StoreProjetFilters }) => {
        const state = get()
        const { force = false, filters = {} } = options || {}

        // Early return if cache is valid
        if (shouldUseCachedProjets(state, force)) {
          return state.projets
        }

        return executeAsyncAction(async () => {
          const projets = await projetService?.fetchProjets(filters)

          set((state: ProjetState & ProjetStoreActions) => {
            state.projets = projets
            state.lastFetch = Date.now()
            state.lastUpdate = Date.now()
          })

          return projets
        }, set)
      },

      // Création d'un projet (reduced complexity from ~6 to ~3)
      createProjet: async (projet: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>) => {
        return executeAsyncAction(async () => {
          const newProjet = await projetService?.createProjet(projet)

          if (newProjet) {
            set((state: ProjetState & ProjetStoreActions) => {
              state.projets?.push(newProjet)
              state.lastUpdate = Date.now()
            })
          }

          return newProjet
        }, set)
      },

      // Mise à jour d'un projet (reduced complexity from ~8 to ~3)
      updateProjet: async (id: string, updates: Partial<StoreProjet>) => {
        return executeAsyncAction(async () => {
          const updatedProjet = await projetService?.updateProjet(id, updates)

          if (updatedProjet) {
            set((state: ProjetState & ProjetStoreActions) => {
              updateProjetInState(state, id, updatedProjet)
              state.lastUpdate = Date.now()
            })
          }

          return updatedProjet
        }, set)
      },

      // Suppression d'un projet (reduced complexity from ~6 to ~3)
      deleteProjet: async (id: string) => {
        return executeAsyncAction(async () => {
          const success = await projetService?.deleteProjet(id)

          if (success) {
            set((state: ProjetState & ProjetStoreActions) => {
              state.projets = state.projets?.filter((p: StoreProjet) => p.id !== id) || []
              state.lastUpdate = Date.now()
            })
          }

          return success
        }, set)
      },

      // Chargement des statistiques (reduced complexity from ~4 to ~2)
      loadStats: async () => {
        return executeAsyncAction(
          async () => {
            const stats = await projetService?.getProjetStats()

            set((state: ProjetState & ProjetStoreActions) => {
              state.stats = stats
            })

            return stats
          },
          set,
          false
        ) // No loading state for stats
      },

      // Actions de l'interface
      setSelectedProjet: (projet: StoreProjet | null) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.selectedProjet = projet
        })
      },

      setFilters: (filters: StoreProjetFilters) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.filters = filters
        })
      },

      setSearchTerm: (term: string) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.searchTerm = term
        })
      },

      setSortBy: (sortBy: string) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.sortBy = sortBy as keyof StoreProjet
        })
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.sortOrder = order
        })
      },

      setCurrentPage: (page: number) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.currentPage = page
        })
      },

      clearError: () => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.error = null
        })
      },

      // Action de reset
      reset: () => {
        set(() => initialProjetState)
      },

      // Missing actions to match ProjetStoreActions interface
      fetchProjets: async (options?: { force?: boolean; filters?: StoreProjetFilters }) => {
        // Call loadProjets directly from the same store context
        const state = get()
        const { force = false, filters = {} } = options || {}

        // Early return if cache is valid
        if (shouldUseCachedProjets(state, force)) {
          return state.projets
        }

        return executeAsyncAction(async () => {
          const projets = await projetService?.fetchProjets(filters)

          set((state: ProjetState & ProjetStoreActions) => {
            state.projets = projets
            state.lastFetch = Date.now()
            state.lastUpdate = Date.now()
          })

          return projets
        }, set)
      },

      duplicateProjet: async (projetId: string) => {
        const projet = get().projets.find((p) => p.id === projetId)
        if (!projet) return null

        const duplicated: StoreProjet = {
          ...projet,
          id: crypto.randomUUID(),
          nom: `${(projet as unknown).nom} (Copie)`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as StoreProjet

        set((state: ProjetState & ProjetStoreActions) => {
          state.projets.push(duplicated)
        })

        return duplicated
      },

      selectProjetById: (id: string) => {
        const projet = get().projets.find((p) => p.id === id)
        get().setSelectedProjet(projet || null)
      },

      clearFilters: () => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.filters = {}
          state.searchTerm = ''
        })
      },

      toggleProjetFavorite: (projetId: string) => {
        set((state: ProjetState & ProjetStoreActions) => {
          const projet = state.projets.find((p) => p.id === projetId)
          if (projet) {
            // Add isFavorite if not exists (StoreProjet may not have this property in the base interface)
            ;(projet as unknown).isFavorite = !(projet as unknown).isFavorite
          }
        })
      },

      updateProjetProgress: (projetId: string, progress: number) => {
        set((state: ProjetState & ProjetStoreActions) => {
          const projet = state.projets.find((p) => p.id === projetId)
          if (projet) {
            // Use avancement which is the correct property name in the Projet interface
            ;(projet as unknown).avancement = Math.min(100, Math.max(0, progress))
          }
        })
      },

      archiveProjet: (projetId: string) => {
        set((state: ProjetState & ProjetStoreActions) => {
          const projet = state.projets.find((p) => p.id === projetId)
          if (projet) {
            projet.statut = ProjetStatut.ANNULE
          }
        })
      },

      restoreProjet: (projetId: string) => {
        set((state: ProjetState & ProjetStoreActions) => {
          const projet = state.projets.find((p) => p.id === projetId)
          if (projet && projet.statut === ProjetStatut.ANNULE) {
            projet.statut = ProjetStatut.EN_COURS
          }
        })
      },

      bulkUpdateStatus: (projetIds: string[], status: ProjetStatut) => {
        set((state: ProjetState & ProjetStoreActions) => {
          projetIds.forEach((id) => {
            const projet = state.projets.find((p) => p.id === id)
            if (projet) {
              projet.statut = status
            }
          })
        })
      },

      getProjetsByStatus: (status: ProjetStatut) => {
        return get().projets.filter((p) => p.statut === status)
      },

      getProjetsByPriority: (priority: ProjetPriorite) => {
        return get().projets.filter((p) => p.priorite === priority)
      },

      // Additional missing methods
      setSorting: (sortBy: keyof StoreProjet, sortOrder: 'asc' | 'desc' = 'asc') => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.sortBy = sortBy
          state.sortOrder = sortOrder
        })
      },

      setPage: (page: number) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.currentPage = page
        })
      },

      setPageSize: (pageSize: number) => {
        set((state: ProjetState & ProjetStoreActions) => {
          ;(state as unknown).pageSize = pageSize
        })
      },

      invalidateCache: () => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.lastUpdate = 0
        })
      },

      getFilteredProjets: () => {
        return get().projets
      },

      getPaginatedProjets: () => {
        return get().projets
      },

      getTotalProjects: () => {
        return get().projets.length
      },

      // Missing BaseStoreActions methods
      setLoading: (loading: boolean) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.loading = loading
          state.lastUpdate = Date.now()
        })
      },

      setError: (error: string | null) => {
        set((state: ProjetState & ProjetStoreActions) => {
          state.error = error
          state.lastUpdate = Date.now()
        })
      },

      // Missing ProjetStoreActions methods
      refreshStats: async () => {
        try {
          set((state: ProjetState & ProjetStoreActions) => {
            state.loading = true
            state.error = null
          })

          // Calculate stats from current projets data
          const projets = get().projets
          const stats = {
            total: projets.length,
            enCours: projets.filter((p) => p.statut === ProjetStatut.EN_COURS).length,
            termines: projets.filter((p) => p.statut === ProjetStatut.TERMINE).length,
            enRetard: projets.filter(
              (p) =>
                p.statut === ProjetStatut.EN_COURS &&
                p.dateFinPrevue &&
                new Date(p.dateFinPrevue) < new Date()
            ).length,
            chiffreAffaireMois: projets.reduce((sum, p) => sum + (p.montantHT || 0), 0),
            margeGlobale: 0, // Would need more complex calculation based on costs
            tauxReussite:
              projets.length > 0
                ? (projets.filter((p) => p.statut === ProjetStatut.TERMINE).length /
                    projets.length) *
                  100
                : 0,
            tempsMovenRealisation: 30, // Default average days - would need more complex calculation
          }

          set((state: ProjetState & ProjetStoreActions) => {
            state.stats = stats
            state.loading = false
            state.lastUpdate = Date.now()
          })
        } catch (error) {
          set((state: ProjetState & ProjetStoreActions) => {
            state.error = error instanceof Error ? error.message : 'Failed to refresh stats'
            state.loading = false
          })
        }
      },
    })),
    {
      name: 'projet-store',
    }
  )
)

// ===== HOOKS SÉLECTEURS =====

export const useProjetLoading = () => useProjetStore((state) => state?.loading)
export const useProjetError = () => useProjetStore((state) => state?.error)
export const useProjets = () => useProjetStore((state) => state?.projets)
export const useSelectedProjet = () => useProjetStore((state) => state?.selectedProjet)
export const useProjetFilters = () => useProjetStore((state) => state?.filters)
export const useProjetStats = () => useProjetStore((state) => state?.stats)

// ===== EXPORTS =====
export type { ProjetState, ProjetStore, ProjetStoreActions }
