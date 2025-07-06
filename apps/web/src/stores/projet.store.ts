/**
 * 📋 STORE PROJETS CORRIGÉ - TopSteel ERP
 * Exemple d'utilisation de la nouvelle architecture pour les stores
 * Fichier: apps/web/src/stores/projet.store.ts
 */

import { StoreUtils } from '@/lib/store-utils'
import type {
  InitialState,
  ProjetFilters,
  ProjetState,
  ProjetStats,
  ProjetStore,
  ProjetStoreActions,
  StoreCreator,
  StoreProjet
} from '@erp/types'

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
  sortBy: 'reference', // Utiliser une propriété qui existe dans StoreProjet
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
  stats: null
}

// ===== CACHE ET UTILITAIRES =====

const projetCache = StoreUtils.createCache<string, StoreProjet[]>(300000) // 5 minutes
const statsCache = StoreUtils.createCache<string, ProjetStats>(60000) // 1 minute

// ===== ACTIONS ASYNC =====

/**
 * Service de données simulé (remplacer par vraie API)
 */
const projetService = {
  async fetchProjets(filters?: ProjetFilters): Promise<StoreProjet[]> {
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Retourner des données mockées ou utiliser l'API réelle
    return []
  },

  async createProjet(data: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreProjet> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const now = new Date()
    
    // Créer un client par défaut si non fourni
    const defaultClient = data.client || {
      id: 'default-client',
      nom: 'Client par défaut',
      email: 'client@example.com',
      type: 'PARTICULIER' as const,
      createdAt: now,
      updatedAt: now
    }
    
    // Créer une adresse par défaut si non fournie
    const defaultAdresse = data.adresseChantier || {
      rue: '123 Rue Exemple',
      ville: 'Paris',
      codePostal: '75001',
      pays: 'France'
    }
    
    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      
      // Propriétés obligatoires avec valeurs par défaut
      client: defaultClient,
      clientId: data.clientId || defaultClient.id,
      adresseChantier: defaultAdresse,
      montantHT: data.montantHT || 0,
      montantTTC: data.montantTTC || 0,
      tauxTVA: data.tauxTVA || 20,
      marge: data.marge || 0,
      avancement: data.avancement || 0,
      documentsIds: data.documentsIds || [],
      ordresFabricationIds: data.ordresFabricationIds || []
    } as StoreProjet
  },

  async updateProjet(id: string, updates: Partial<StoreProjet>): Promise<StoreProjet> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Retourner le projet mis à jour
    return { 
      id, 
      ...updates,
      updatedAt: new Date()
    } as StoreProjet
  },

  async deleteProjet(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return true
  },

  async getStats(): Promise<ProjetStats> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      total: 0,
      parStatut: {},
      parPriorite: {},
      parType: {},
      enRetard: 0,
      terminesTemps: 0,
      avancementMoyen: 0,
      chiffreAffaireMensuel: 0,
      chiffreAffaireAnnuel: 0,
      margeGlobale: 0,
      projetsActifs: 0,
      nouveauxCeMois: 0
    }
  }
}

// ===== DÉFINITION DU STORE =====

const createProjetStoreActions: StoreCreator<ProjetState, ProjetStoreActions> = (set, get) => {
  const baseActions = StoreUtils.createBaseActions(initialProjetState)

  return {
    // Actions de base
    ...baseActions,

    // ===== ACTIONS DE DONNÉES =====
    fetchProjets: StoreUtils.createAsyncAction<ProjetState, [{ force?: boolean; filters?: ProjetFilters }?], StoreProjet[]>(
      async (options = {}) => {
        const { force = false, filters } = options
        const cacheKey = JSON.stringify(filters || {})
        
        // Vérifier le cache si pas de force
        if (!force) {
          const cached = projetCache.get(cacheKey)
          if (cached) {
            return cached
          }
        }
        
        const projets = await projetService.fetchProjets(filters)
        projetCache.set(cacheKey, projets)
        return projets
      },
      {
        onStart: (state) => {
          state.isSyncing = true
        },
        onSuccess: (state, projets) => {
          state.projets = projets
          state.totalCount = projets.length
          state.lastFetch = Date.now()
          state.isSyncing = false
        },
        onError: (state, error) => {
          state.isSyncing = false
          console.error('Erreur fetch projets:', error)
        }
      }
    ),

    createProjet: StoreUtils.createAsyncAction<ProjetState, [Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>], StoreProjet>(
      async (projetData) => {
        const newProjet = await projetService.createProjet(projetData)
        return newProjet
      },
      {
        onSuccess: (state, newProjet) => {
          state.projets.unshift(newProjet)
          state.totalCount++
          
          // Invalider le cache
          projetCache.delete()
          statsCache.delete()
        }
      }
    ),

    updateProjet: StoreUtils.createAsyncAction<ProjetState, [string, Partial<StoreProjet>], StoreProjet>(
      async (id, updates) => {
        const updatedProjet = await projetService.updateProjet(id, updates)
        return updatedProjet
      },
      {
        onSuccess: (state, updatedProjet) => {
          const index = state.projets.findIndex(p => p.id === updatedProjet.id)
          if (index !== -1) {
            state.projets[index] = { ...state.projets[index], ...updatedProjet }
          }
          
          // Mettre à jour le projet sélectionné si nécessaire
          if (state.selectedProjet?.id === updatedProjet.id) {
            state.selectedProjet = { ...state.selectedProjet, ...updatedProjet }
          }
          
          // Invalider les caches
          projetCache.delete()
          statsCache.delete()
        }
      }
    ),

    deleteProjet: StoreUtils.createAsyncAction<ProjetState, [string], boolean>(
      async (id) => {
        const success = await projetService.deleteProjet(id)
        return success
      },
      {
        onSuccess: (state, success, id) => {
          if (success) {
            state.projets = state.projets.filter(p => p.id !== id)
            state.totalCount--
            
            // Désélectionner si c'était le projet supprimé
            if (state.selectedProjet?.id === id) {
              state.selectedProjet = null
            }
            
            // Invalider les caches
            projetCache.delete()
            statsCache.delete()
          }
        }
      }
    ),

    duplicateProjet: StoreUtils.createAsyncAction<ProjetState, [string], StoreProjet>(
      async (id) => {
        const currentState = get()
        const originalProjet = currentState.projets.find(p => p.id === id)
        
        if (!originalProjet) {
          throw new Error('Projet non trouvé')
        }
        
        const { id: _, createdAt: __, updatedAt: ___, ...projetData } = originalProjet
        const duplicatedProjet = await projetService.createProjet({
          ...projetData,
          reference: `${projetData.reference}_COPIE`,
          description: `Copie de ${projetData.description}`
        })
        
        return duplicatedProjet
      },
      {
        onSuccess: (state, duplicatedProjet) => {
          state.projets.unshift(duplicatedProjet)
          state.totalCount++
          projetCache.delete()
        }
      }
    ),

    // ===== ACTIONS DE SÉLECTION =====
    setSelectedProjet: (projet: StoreProjet | null) => set((state) => {
      state.selectedProjet = projet
      state.lastUpdate = Date.now()
    }),

    selectProjetById: (id) => set((state) => {
      const projet = state.projets.find(p => p.id === id)
      state.selectedProjet = projet || null
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS DE FILTRAGE =====
    setFilters: (filters) => set((state) => {
      state.filters = { ...state.filters, ...filters }
      state.currentPage = 1 // Reset pagination
      state.lastUpdate = Date.now()
    }),

    clearFilters: () => set((state) => {
      state.filters = {}
      state.searchTerm = ''
      state.currentPage = 1
      state.lastUpdate = Date.now()
    }),

    setSearchTerm: StoreUtils.debounce((term: string) => set((state) => {
      state.searchTerm = term
      state.currentPage = 1
      state.lastUpdate = Date.now()
    }), 300),

    // ===== ACTIONS DE TRI ET PAGINATION =====
    setSorting: (sortBy, sortOrder = 'asc') => set((state) => {
      state.sortBy = sortBy
      state.sortOrder = sortOrder
      state.lastUpdate = Date.now()
    }),

    setPage: (page) => set((state) => {
      state.currentPage = page
      state.lastUpdate = Date.now()
    }),

    setPageSize: (size) => set((state) => {
      state.pageSize = size
      state.currentPage = 1 // Reset à la première page
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS DE CACHE =====
    invalidateCache: () => set((state) => {
      projetCache.delete()
      statsCache.delete()
      state.lastFetch = 0
      state.stats = null
      state.lastUpdate = Date.now()
    }),

    refreshStats: StoreUtils.createAsyncAction<ProjetState, [], void>(
      async () => {
        // Vérifier le cache d'abord
        const cached = statsCache.get('stats')
        if (cached) {
          return cached
        }
        
        const stats = await projetService.getStats()
        statsCache.set('stats', stats)
        return stats
      },
      {
        onSuccess: (state, stats) => {
          state.stats = stats
        }
      }
    )
  }
}

// ===== CRÉATION DU STORE =====

export const useProjetStore = StoreUtils.createRobustStore<ProjetState, ProjetStoreActions>(
  initialProjetState,
  createProjetStoreActions,
  {
    name: 'projet-store',
    persist: false, // Pas de persistence pour ce store
    devtools: true,
    immer: true,
    subscriptions: true
  }
)

// ===== SELECTORS OPTIMISÉS =====

export const projetSelectors = {
  // Sélecteurs de base
  getProjets: (state: ProjetStore) => state.projets,
  getSelectedProjet: (state: ProjetStore) => state.selectedProjet,
  getFilters: (state: ProjetStore) => state.filters,
  getSearchTerm: (state: ProjetStore) => state.searchTerm,
  
  // Sélecteurs calculés
  getFilteredProjets: StoreUtils.createSelector((state: ProjetStore) => {
    let projets = [...state.projets]
    
    // Appliquer les filtres
    if (Object.keys(state.filters).length > 0) {
      projets = projets.filter(projet => {
        // Logique de filtrage selon les filtres actifs
        return true // Simplifiée pour l'exemple
      })
    }
    
    // Appliquer la recherche
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase()
      projets = projets.filter(projet => 
        projet.reference.toLowerCase().includes(term) ||
        projet.description.toLowerCase().includes(term)
      )
    }
    
    // Appliquer le tri
    projets.sort((a, b) => {
      const aValue = a[state.sortBy] as any
      const bValue = b[state.sortBy] as any
      
      // Gestion des valeurs nulles/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return state.sortOrder === 'asc' ? -1 : 1
      if (bValue == null) return state.sortOrder === 'asc' ? 1 : -1
      
      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return projets
  }),
  
  // Sélecteurs de pagination
  getPaginatedProjets: (state: ProjetStore) => {
    const filtered = projetSelectors.getFilteredProjets(state)
    const start = (state.currentPage - 1) * state.pageSize
    const end = start + state.pageSize
    return filtered.slice(start, end)
  },
  
  getTotalPages: (state: ProjetStore) => {
    const filtered = projetSelectors.getFilteredProjets(state)
    return Math.ceil(filtered.length / state.pageSize)
  },
  
  // Sélecteurs de statut
  getLoadingState: (state: ProjetStore) => state.loading,
  getSyncingState: (state: ProjetStore) => state.isSyncing,
  getErrorState: (state: ProjetStore) => state.error,
  getStats: (state: ProjetStore) => state.stats
}

// ===== HOOKS PERSONNALISÉS =====

export const useProjetSelector = <T>(selector: (state: ProjetStore) => T) => {
  return useProjetStore(selector)
}

// ===== EXPORTS =====
export type { ProjetState, ProjetStore, ProjetStoreActions }
