/**
 * 📋 STORE PROJETS - TopSteel ERP
 * Gestion robuste des projets avec cache intelligent et optimisations
 * Fichier: apps/web/src/stores/projet.store.ts
 */
import { StoreUtils, type BaseStoreState } from '@/lib/store-utils'
import type { Projet } from '@erp/types'

// ===== INTERFACES =====
interface ProjetFilters {
  statut?: string[]
  priorite?: string[]
  dateDebut?: { from?: string; to?: string }
  dateEcheance?: { from?: string; to?: string }
  responsable?: string[]
  client?: string[]
  search?: string
  tags?: string[]
}

interface ProjetStats {
  total: number
  parStatut: Record<string, number>
  parPriorite: Record<string, number>
  enRetard: number
  terminesTemps: number
  avancementMoyen: number
}

interface ProjetState extends BaseStoreState {
  // Données
  projets: Projet[]
  selectedProjet: Projet | null
  
  // Filtres et recherche
  filters: ProjetFilters
  searchTerm: string
  sortBy: keyof Projet
  sortOrder: 'asc' | 'desc'
  
  // Pagination
  currentPage: number
  pageSize: number
  totalCount: number
  
  // Cache et métadonnées
  lastFetch: number
  cacheTTL: number
  isSyncing: boolean
  
  // Statistiques calculées
  stats: ProjetStats | null

  // ===== ACTIONS =====
  // Actions de données
  fetchProjets: (options?: { force?: boolean; filters?: ProjetFilters }) => Promise<Projet[]>
  createProjet: (projet: Omit<Projet, 'id' | 'dateCreation'>) => Promise<Projet | null>
  updateProjet: (id: string, updates: Partial<Projet>) => Promise<Projet | null>
  deleteProjet: (id: string) => Promise<boolean>
  duplicateProjet: (id: string) => Promise<Projet | null>
  
  // Actions de sélection
  setSelectedProjet: (projet: Projet | null) => void
  selectProjetById: (id: string) => void
  
  // Actions de filtrage
  setFilters: (filters: Partial<ProjetFilters>) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
  
  // Actions de tri et pagination
  setSorting: (sortBy: keyof Projet, sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  
  // Actions utilitaires
  refreshStats: () => void
  invalidateCache: () => void
  syncWithServer: () => Promise<void>
  
  // Actions de base
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

// ===== ÉTAT INITIAL =====
const initialProjetState: Omit<ProjetState, 'fetchProjets' | 'createProjet' | 'updateProjet' | 'deleteProjet' | 'duplicateProjet' | 'setSelectedProjet' | 'selectProjetById' | 'setFilters' | 'clearFilters' | 'setSearchTerm' | 'setSorting' | 'setPage' | 'setPageSize' | 'refreshStats' | 'invalidateCache' | 'syncWithServer' | 'setLoading' | 'setError' | 'clearError' | 'reset'> = {
  // État de base (de BaseStoreState)
  loading: false,
  error: null,
  lastUpdate: 0,
  
  // Données
  projets: [],
  selectedProjet: null,
  
  // Filtres
  filters: {},
  searchTerm: '',
  sortBy: 'dateCreation',
  sortOrder: 'desc',
  
  // Pagination
  currentPage: 0,
  pageSize: 20,
  totalCount: 0,
  
  // Cache
  lastFetch: 0,
  cacheTTL: 300000, // 5 minutes
  isSyncing: false,
  
  // Stats
  stats: null
}

// ===== API SIMULÉE (À REMPLACER PAR VOTRE API) =====
const projetAPI = {
  async fetchProjets(filters: ProjetFilters = {}): Promise<{ projets: Projet[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Données mockées
    const mockProjets: Projet[] = Array.from({ length: 50 }, (_, i) => ({
      id: `projet-${i + 1}`,
      nom: `Projet ${i + 1}`,
      description: `Description du projet ${i + 1}`,
      statut: ['EN_COURS', 'TERMINE', 'EN_ATTENTE', 'ANNULE'][Math.floor(Math.random() * 4)] as any,
      priorite: ['normale', 'haute', 'urgente'][Math.floor(Math.random() * 3)] as any,
      dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      dateEcheance: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      avancement: Math.floor(Math.random() * 100),
      client: `Client ${Math.floor(Math.random() * 10) + 1}`,
      responsable: `Responsable ${Math.floor(Math.random() * 5) + 1}`,
      budget: Math.floor(Math.random() * 100000) + 10000,
      tags: [`tag${Math.floor(Math.random() * 5) + 1}`, `tag${Math.floor(Math.random() * 5) + 6}`]
    }))
    
    // Filtrage simulé
    let filtered = mockProjets
    
    if (filters.statut?.length) {
      filtered = filtered.filter(p => filters.statut!.includes(p.statut))
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.client.toLowerCase().includes(search)
      )
    }
    
    return { projets: filtered, total: filtered.length }
  },
  
  async createProjet(projet: Omit<Projet, 'id' | 'dateCreation'>): Promise<Projet> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      ...projet,
      id: crypto.randomUUID(),
      dateCreation: new Date().toISOString()
    }
  },
  
  async updateProjet(id: string, updates: Partial<Projet>): Promise<Projet> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Simulation - dans la vraie vie, récupérer du serveur
    return {
      id,
      nom: 'Projet mis à jour',
      ...updates
    } as Projet
  },
  
  async deleteProjet(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    // Simulation de suppression
  }
}

// ===== UTILITAIRES =====
const calculateStats = (projets: Projet[]): ProjetStats => {
  const stats: ProjetStats = {
    total: projets.length,
    parStatut: {},
    parPriorite: {},
    enRetard: 0,
    terminesTemps: 0,
    avancementMoyen: 0
  }
  
  if (projets.length === 0) return stats
  
  let totalAvancement = 0
  const now = Date.now()
  
  projets.forEach(projet => {
    // Compter par statut
    stats.parStatut[projet.statut] = (stats.parStatut[projet.statut] || 0) + 1
    
    // Compter par priorité
    stats.parPriorite[projet.priorite] = (stats.parPriorite[projet.priorite] || 0) + 1
    
    // Calculer retards et terminés à temps
    const echeance = new Date(projet.dateEcheance).getTime()
    if (projet.statut === 'TERMINE') {
      // Logique simplifiée - dans la vraie vie, comparer dateTerminaison avec dateEcheance
      stats.terminesTemps++
    } else if (now > echeance) {
      stats.enRetard++
    }
    
    totalAvancement += projet.avancement
  })
  
  stats.avancementMoyen = Math.round(totalAvancement / projets.length)
  
  return stats
}

// ===== CACHE INTELLIGENT =====
const cache = StoreUtils.createStoreCache<string, any>(300000) // 5 minutes

// ===== CRÉATION DU STORE =====
export const useProjetStore = StoreUtils.createRobustStore<ProjetState>(
  initialProjetState as ProjetState,
  (set, get) => {
    const baseActions = StoreUtils.createBaseActions<ProjetState>()
    
    // Action de fetch avec cache intelligent
    const fetchProjets = StoreUtils.createAsyncAction(
      async (options: { force?: boolean; filters?: ProjetFilters } = {}) => {
        const { force = false, filters } = options
        const currentState = get()
        const finalFilters = filters || currentState.filters
        
        const cacheKey = `projets-${JSON.stringify(finalFilters)}`
        const now = Date.now()
        
        // Vérifier le cache si pas de force
        if (!force && currentState.lastFetch && (now - currentState.lastFetch) < currentState.cacheTTL) {
          const cached = cache.get(cacheKey)
          if (cached) {
            return cached
          }
        }
        
        const result = await projetAPI.fetchProjets(finalFilters)
        
        // Mettre en cache
        cache.set(cacheKey, result)
        
        return result
      },
      {
        onSuccess: (state: ProjetState, result) => {
          state.projets = result.projets
          state.totalCount = result.total
          state.lastFetch = Date.now()
          
          // Recalculer les stats
          state.stats = calculateStats(result.projets)
          
          // Si on a un projet sélectionné, le mettre à jour
          if (state.selectedProjet) {
            const updated = result.projets.find(p => p.id === state.selectedProjet!.id)
            if (updated) {
              state.selectedProjet = updated
            }
          }
        }
      }
    )
    
    const createProjet = StoreUtils.createAsyncAction(
      async (projetData: Omit<Projet, 'id' | 'dateCreation'>) => {
        const result = await projetAPI.createProjet(projetData)
        return result
      },
      {
        onSuccess: (state: ProjetState, result) => {
          state.projets.unshift(result)
          state.totalCount++
          state.stats = calculateStats(state.projets)
          
          // Invalider le cache
          cache.invalidate()
          state.lastFetch = 0
        }
      }
    )
    
    const updateProjet = StoreUtils.createAsyncAction(
      async ({ id, updates }: { id: string; updates: Partial<Projet> }) => {
        const result = await projetAPI.updateProjet(id, updates)
        return result
      },
      {
        onSuccess: (state: ProjetState, result) => {
          const index = state.projets.findIndex(p => p.id === result.id)
          if (index !== -1) {
            state.projets[index] = result
          }
          
          if (state.selectedProjet?.id === result.id) {
            state.selectedProjet = result
          }
          
          state.stats = calculateStats(state.projets)
          cache.invalidate()
        }
      }
    )
    
    const deleteProjet = StoreUtils.createAsyncAction(
      async (id: string) => {
        await projetAPI.deleteProjet(id)
        return id
      },
      {
        onSuccess: (state: ProjetState, deletedId) => {
          state.projets = state.projets.filter(p => p.id !== deletedId)
          state.totalCount--
          
          if (state.selectedProjet?.id === deletedId) {
            state.selectedProjet = null
          }
          
          state.stats = calculateStats(state.projets)
          cache.invalidate()
        }
      }
    )
    
    return {
      ...initialProjetState,
      
      // ===== ACTIONS DE DONNÉES =====
      fetchProjets: async (options) => {
        const result = await fetchProjets(set, get, options)
        return result?.projets || []
      },
      
      createProjet: async (projetData) => {
        return await createProjet(set, get, projetData)
      },
      
      updateProjet: async (id, updates) => {
        return await updateProjet(set, get, { id, updates })
      },
      
      deleteProjet: async (id) => {
        const result = await deleteProjet(set, get, id)
        return !!result
      },
      
      duplicateProjet: async (id) => {
        const original = get().projets.find(p => p.id === id)
        if (!original) return null
        
        const duplicated = {
          ...original,
          nom: `${original.nom} (Copie)`,
          statut: 'EN_ATTENTE' as const,
          avancement: 0
        }
        
        const { id: _, dateCreation: __, ...dataWithoutId } = duplicated
        return await createProjet(set, get, dataWithoutId)
      },
      
      // ===== ACTIONS DE SÉLECTION =====
      setSelectedProjet: (projet) => set((state) => {
        state.selectedProjet = projet
        state.lastUpdate = Date.now()
      }),
      
      selectProjetById: (id) => set((state) => {
        const projet = state.projets.find(p => p.id === id)
        state.selectedProjet = projet || null
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS DE FILTRAGE =====
      setFilters: (newFilters) => set((state) => {
        state.filters = { ...state.filters, ...newFilters }
        state.currentPage = 0 // Reset pagination
        state.lastFetch = 0 // Force refetch
        state.lastUpdate = Date.now()
      }),
      
      clearFilters: () => set((state) => {
        state.filters = {}
        state.searchTerm = ''
        state.currentPage = 0
        state.lastFetch = 0
        state.lastUpdate = Date.now()
      }),
      
      setSearchTerm: (term) => set((state) => {
        state.searchTerm = term
        state.filters = { ...state.filters, search: term || undefined }
        state.currentPage = 0
        state.lastFetch = 0
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS DE TRI ET PAGINATION =====
      setSorting: (sortBy, sortOrder) => set((state) => {
        state.sortBy = sortBy
        state.sortOrder = sortOrder || (state.sortOrder === 'asc' ? 'desc' : 'asc')
        state.lastUpdate = Date.now()
      }),
      
      setPage: (page) => set((state) => {
        state.currentPage = Math.max(0, page)
        state.lastUpdate = Date.now()
      }),
      
      setPageSize: (size) => set((state) => {
        state.pageSize = Math.max(1, size)
        state.currentPage = 0 // Reset page
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS UTILITAIRES =====
      refreshStats: () => set((state) => {
        state.stats = calculateStats(state.projets)
        state.lastUpdate = Date.now()
      }),
      
      invalidateCache: () => set((state) => {
        cache.invalidate()
        state.lastFetch = 0
        state.lastUpdate = Date.now()
      }),
      
      syncWithServer: async () => {
        set((state) => { state.isSyncing = true })
        try {
          await fetchProjets(set, get, { force: true })
        } finally {
          set((state) => { state.isSyncing = false })
        }
      },
      
      // ===== ACTIONS DE BASE =====
      setLoading: (loading: boolean) => set(baseActions.setLoading(loading)),
      setError: (error: string | null) => set(baseActions.setError(error)),
      clearError: () => set(baseActions.clearError()),
      reset: () => set((state: ProjetState) => {
        Object.assign(state, {
          ...initialProjetState,
          stats: null
        })
      })
      
    } as ProjetState
  },
  {
    name: 'projet-store',
    persist: false, // Les données projet viennent du serveur
    devtools: true,
    immer: true,
    subscriptions: true
  }
)

// ===== SÉLECTEURS HOOKS INDIVIDUELS =====
/**
 * Hook pour récupérer tous les projets
 */
export const useProjetsProjets = () => useProjetStore(state => state.projets)

/**
 * Hook pour le projet sélectionné
 */
export const useProjetsSelectedProjet = () => useProjetStore(state => state.selectedProjet)

/**
 * Hook pour l'état de chargement des projets
 */
export const useProjetsLoading = () => useProjetStore(state => state.loading)

/**
 * Hook pour les erreurs des projets
 */
export const useProjetsError = () => useProjetStore(state => state.error)

/**
 * Hook pour les statistiques des projets
 */
export const useProjetsStats = () => useProjetStore(state => state.stats)

/**
 * Hook pour les projets filtrés avec tri appliqué
 */
export const useProjetsFilteredProjets = () => useProjetStore(state => {
  const filtered = [...state.projets]
  
  // Appliquer le tri
  filtered.sort((a, b) => {
    const aVal = a[state.sortBy]
    const bVal = b[state.sortBy]
    
    if (state.sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  return filtered
})

/**
 * Hook pour la pagination des projets
 */
export const useProjetsPaginatedProjets = () => useProjetStore(state => {
  const filtered = state.projets // Déjà filtré côté serveur
  const start = state.currentPage * state.pageSize
  const end = start + state.pageSize
  
  return {
    items: filtered.slice(start, end),
    total: state.totalCount,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalPages: Math.ceil(state.totalCount / state.pageSize),
    hasNext: end < state.totalCount,
    hasPrev: state.currentPage > 0
  }
})

/**
 * Hook pour les projets par statut
 */
export const useProjetsProjetsByStatus = (status: string) => useProjetStore(state => 
  state.projets.filter(p => p.statut === status)
)

/**
 * Hook pour les projets urgents
 */
export const useProjetsUrgentProjets = () => useProjetStore(state => 
  state.projets.filter(p => p.priorite === 'urgente' && p.statut !== 'TERMINE')
)

/**
 * Hook pour les projets en retard
 */
export const useProjetsOverdueProjets = () => useProjetStore(state => {
  const now = Date.now()
  return state.projets.filter(p => 
    p.statut !== 'TERMINE' && 
    new Date(p.dateEcheance).getTime() < now
  )
})

// ===== TYPES EXPORTÉS =====
export type { ProjetFilters, ProjetState, ProjetStats }
