/**
 * 📋 STORE PROJETS CORRIGÉ - TopSteel ERP
 * Store projets avec actions async directes (sans createAsyncAction)
 * Fichier: apps/web/src/stores/projet.store.ts
 */

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
    const projets = await this.fetchProjets()
    return projets.find((p) => p.id === id) || null
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

    const existingProjet = await this.fetchProjetById(id)
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

export const useProjetStore = create<ProjetStore>()(
  devtools(
    immer(
      (set, get) =>
        ({
          ...initialProjetState,

          // ===== ACTIONS =====

          // Chargement des projets
          loadProjets: async (options?: { force?: boolean; filters?: StoreProjetFilters }) => {
            const state = get()
            const { force = false, filters = {} } = options || {}

            // Vérifier le cache si pas forcé
            if (!force && state.projets.length > 0) {
              const timeSinceLastFetch = Date.now() - state.lastFetch
              if (timeSinceLastFetch < state.cacheTTL) {
                return state.projets
              }
            }

            set((state) => {
              state.loading = true
              state.error = null
            })

            try {
              const projets = await projetService.fetchProjets(filters)

              set((state) => {
                state.projets = projets
                state.loading = false
                state.lastFetch = Date.now()
                state.lastUpdate = Date.now()
              })

              return projets
            } catch (error) {
              set((state) => {
                state.loading = false
                state.error = error instanceof Error ? error.message : 'Erreur inconnue'
              })
              throw error
            }
          },

          // Création d'un projet
          createProjet: async (projet: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>) => {
            set((state) => {
              state.loading = true
              state.error = null
            })

            try {
              const newProjet = await projetService.createProjet(projet)

              if (newProjet) {
                set((state) => {
                  state.projets.push(newProjet)
                  state.loading = false
                  state.lastUpdate = Date.now()
                })
              }

              return newProjet
            } catch (error) {
              set((state) => {
                state.loading = false
                state.error = error instanceof Error ? error.message : 'Erreur inconnue'
              })
              throw error
            }
          },

          // Mise à jour d'un projet
          updateProjet: async (id: string, updates: Partial<StoreProjet>) => {
            set((state) => {
              state.loading = true
              state.error = null
            })

            try {
              const updatedProjet = await projetService.updateProjet(id, updates)

              if (updatedProjet) {
                set((state) => {
                  const index = state.projets.findIndex((p) => p.id === id)
                  if (index !== -1) {
                    state.projets[index] = updatedProjet
                  }
                  state.loading = false
                  state.lastUpdate = Date.now()
                })
              }

              return updatedProjet
            } catch (error) {
              set((state) => {
                state.loading = false
                state.error = error instanceof Error ? error.message : 'Erreur inconnue'
              })
              throw error
            }
          },

          // Suppression d'un projet
          deleteProjet: async (id: string) => {
            set((state) => {
              state.loading = true
              state.error = null
            })

            try {
              const success = await projetService.deleteProjet(id)

              if (success) {
                set((state) => {
                  state.projets = state.projets.filter((p) => p.id !== id)
                  state.loading = false
                  state.lastUpdate = Date.now()
                })
              }

              return success
            } catch (error) {
              set((state) => {
                state.loading = false
                state.error = error instanceof Error ? error.message : 'Erreur inconnue'
              })
              throw error
            }
          },

          // Chargement des statistiques
          loadStats: async () => {
            try {
              const stats = await projetService.getProjetStats()
              set((state) => {
                state.stats = stats
              })
              return stats
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Erreur inconnue'
              })
              throw error
            }
          },

          // Actions de l'interface
          setSelectedProjet: (projet: StoreProjet | null) => {
            set((state) => {
              state.selectedProjet = projet
            })
          },

          setFilters: (filters: StoreProjetFilters) => {
            set((state) => {
              state.filters = filters
            })
          },

          setSearchTerm: (term: string) => {
            set((state) => {
              state.searchTerm = term
            })
          },

          setSortBy: (sortBy: string) => {
            set((state) => {
              state.sortBy = sortBy as any
            })
          },

          setSortOrder: (order: 'asc' | 'desc') => {
            set((state) => {
              state.sortOrder = order
            })
          },

          setCurrentPage: (page: number) => {
            set((state) => {
              state.currentPage = page
            })
          },

          clearError: () => {
            set((state) => {
              state.error = null
            })
          },

          // Action de reset
          reset: () => {
            set(initialProjetState)
          },
        }) as any
    ),
    {
      name: 'projet-store',
    }
  )
)

// ===== HOOKS SÉLECTEURS =====

export const useProjetLoading = () => useProjetStore((state) => state.loading)
export const useProjetError = () => useProjetStore((state) => state.error)
export const useProjets = () => useProjetStore((state) => state.projets)
export const useSelectedProjet = () => useProjetStore((state) => state.selectedProjet)
export const useProjetFilters = () => useProjetStore((state) => state.filters)
export const useProjetStats = () => useProjetStore((state) => state.stats)

// ===== EXPORTS =====
export type { ProjetState, ProjetStore, ProjetStoreActions }
