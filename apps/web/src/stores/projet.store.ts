/**
 * 📋 STORE PROJETS CORRIGÉ - TopSteel ERP
 * Gestion robuste des projets avec types centralisés
 * Fichier: apps/web/src/stores/projet.store.ts
 */
import { StoreUtils } from '@/lib/store-utils';
import type { Projet, ProjetFilters, ProjetStoreState } from '@erp/types';

// ===== ÉTAT INITIAL =====
const initialProjetState: Omit<ProjetStoreState, 
  | 'fetchProjets' | 'createProjet' | 'updateProjet' | 'deleteProjet' 
  | 'duplicateProjet' | 'setSelectedProjet' | 'selectProjetById' 
  | 'setFilters' | 'clearFilters' | 'setSearchTerm' | 'setSorting' 
  | 'setPage' | 'setPageSize' | 'refreshStats' | 'invalidateCache' 
  | 'syncWithServer' | 'setLoading' | 'setError' | 'clearError' 
  | 'reset' | 'updateLastActivity'
> = {
  // État de base (de BaseStoreState)
  loading: false,
  error: null,
  lastUpdate: 0,
  version: '1.0.0',
  
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
      type: ['PORTAIL', 'CLOTURE', 'ESCALIER'][Math.floor(Math.random() * 3)] as any,
      priorite: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'][Math.floor(Math.random() * 4)] as any,
      dateCreation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      dateDebut: new Date(),
      dateFinPrevue: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
      montantHT: Math.floor(Math.random() * 100000),
      montantTTC: 0,
      tauxTVA: 20,
      marge: 0,
      avancement: Math.floor(Math.random() * 100),
      reference: `REF-${i + 1}`,
      clientId: `client-${Math.floor(Math.random() * 10) + 1}`,
      client: {
        id: `client-${Math.floor(Math.random() * 10) + 1}`,
        nom: `Client ${Math.floor(Math.random() * 10) + 1}`,
        type: 'PARTICULIER' as any,
        email: `client${i}@example.com`,
        telephone: '0123456789',
        dateCreation: new Date(),
        dateModification: new Date(),
        adressePrincipale: {
          rue: '123 Rue Example',
          ville: 'Paris',
          codePostal: '75001',
          pays: 'France'
        }
      },
      adresseChantier: {
        rue: '123 Rue Chantier',
        ville: 'Paris',
        codePostal: '75001',
        pays: 'France'
      },
      documentsIds: [],
      ordresFabricationIds: []
    }))
    
    // Simulation de filtrage côté serveur
    let filtered = mockProjets
    if (filters.statut?.length) {
      filtered = filtered.filter(p => filters.statut!.includes(p.statut))
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.reference.toLowerCase().includes(search)
      )
    }
    
    return { projets: filtered, total: filtered.length }
  },
  
  async createProjet(data: Omit<Projet, 'id' | 'dateCreation'>): Promise<Projet> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      ...data,
      id: `projet-${Date.now()}`,
      dateCreation: new Date(),
      dateModification: new Date()
    } as Projet
  },
  
  async updateProjet(id: string, updates: Partial<Projet>): Promise<Projet | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Simulation de mise à jour
    return {
      id,
      ...updates,
      dateModification: new Date()
    } as Projet
  },
  
  async deleteProjet(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return true
  }
}

// ===== CACHE INTELLIGENT =====
const cache = {
  data: new Map<string, { data: any; timestamp: number }>(),
  
  get(key: string, ttl: number = 300000) {
    const cached = this.data.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > ttl) {
      this.data.delete(key)
      return null
    }
    
    return cached.data
  },
  
  set(key: string, data: any) {
    this.data.set(key, { data, timestamp: Date.now() })
  },
  
  invalidate(key?: string) {
    if (key) {
      this.data.delete(key)
    } else {
      this.data.clear()
    }
  }
}

// ===== ACTIONS ASYNC AVEC CACHE =====
const fetchProjets = async (
  set: any, 
  get: () => ProjetStoreState, 
  options: { force?: boolean; filters?: ProjetFilters } = {}
) => {
  const { force = false, filters = {} } = options
  const state = get()
  
  const cacheKey = `projets-${JSON.stringify(filters)}`
  const cached = cache.get(cacheKey, state.cacheTTL)
  
  if (!force && cached && (Date.now() - state.lastFetch) < state.cacheTTL) {
    return cached.projets
  }
  
  set((state: ProjetStoreState) => { state.loading = true })
  
  try {
    const result = await projetAPI.fetchProjets(filters)
    
    set((state: ProjetStoreState) => {
      state.projets = result.projets
      state.totalCount = result.total
      state.lastFetch = Date.now()
      state.loading = false
      state.error = null
    })
    
    cache.set(cacheKey, result)
    return result.projets
  } catch (error) {
    set((state: ProjetStoreState) => {
      state.loading = false
      state.error = error instanceof Error ? error.message : 'Erreur lors du chargement'
    })
    throw error
  }
}

const calculateStats = (projets: Projet[]) => {
  const stats = {
    total: projets.length,
    parStatut: {} as Record<string, number>,
    parPriorite: {} as Record<string, number>,
    enRetard: 0,
    terminesTemps: 0,
    avancementMoyen: 0
  }
  
  projets.forEach(projet => {
    stats.parStatut[projet.statut] = (stats.parStatut[projet.statut] || 0) + 1
    stats.parPriorite[projet.priorite] = (stats.parPriorite[projet.priorite] || 0) + 1
    stats.avancementMoyen += projet.avancement || 0
    
    if (projet.dateFinPrevue && new Date(projet.dateFinPrevue) < new Date() && projet.statut !== 'TERMINE') {
      stats.enRetard++
    }
    if (projet.statut === 'TERMINE') {
      stats.terminesTemps++
    }
  })
  
  if (projets.length > 0) {
    stats.avancementMoyen = stats.avancementMoyen / projets.length
  }
  
  return stats
}

// ===== CRÉATION DU STORE =====
export const useProjetStore = StoreUtils.createRobustStore<ProjetStoreState>(
  initialProjetState,
  (set, get) => ({
    ...initialProjetState,
    
    // ===== ACTIONS DE DONNÉES =====
    fetchProjets: async (options = {}) => fetchProjets(set, get, options),
    
    createProjet: async (projetData) => {
      set((state) => { state.loading = true })
      try {
        const newProjet = await projetAPI.createProjet(projetData)
        
        set((state: ProjetStoreState) => {
          state.projets.unshift(newProjet)
          state.totalCount++
          state.loading = false
          state.error = null
        })
        
        cache.invalidate() // Invalider le cache
        return newProjet
      } catch (error) {
        set((state: ProjetStoreState) => {
          state.loading = false
          state.error = error instanceof Error ? error.message : 'Erreur lors de la création'
        })
        return null
      }
    },
    
    updateProjet: async (id, updates) => {
      set((state) => { state.loading = true })
      try {
        const updatedProjet = await projetAPI.updateProjet(id, updates)
        
        if (updatedProjet) {
          set((state: ProjetStoreState) => {
            const index = state.projets.findIndex(p => p.id === id)
            if (index !== -1) {
              state.projets[index] = { ...state.projets[index], ...updatedProjet }
            }
            if (state.selectedProjet?.id === id) {
              state.selectedProjet = { ...state.selectedProjet, ...updatedProjet }
            }
            state.loading = false
            state.error = null
          })
          
          cache.invalidate()
        }
        
        return updatedProjet
      } catch (error) {
        set((state: ProjetStoreState) => {
          state.loading = false
          state.error = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
        })
        return null
      }
    },
    
    deleteProjet: async (id) => {
      set((state) => { state.loading = true })
      try {
        const success = await projetAPI.deleteProjet(id)
        
        if (success) {
          set((state: ProjetStoreState) => {
            state.projets = state.projets.filter(p => p.id !== id)
            if (state.selectedProjet?.id === id) {
              state.selectedProjet = null
            }
            state.totalCount--
            state.loading = false
            state.error = null
          })
          
          cache.invalidate()
        }
        
        return success
      } catch (error) {
        set((state: ProjetStoreState) => {
          state.loading = false
          state.error = error instanceof Error ? error.message : 'Erreur lors de la suppression'
        })
        return false
      }
    },
    
    duplicateProjet: async (id) => {
      const projet = get().projets.find(p => p.id === id)
      if (!projet) return null
      
      const { id: _, dateCreation: __, ...projetData } = projet
      return await get().createProjet({
        ...projetData,
        nom: `${projet.nom} (copie)`
      })
    },
    
    // ===== ACTIONS DE SÉLECTION =====
    setSelectedProjet: (projet) => set((state: ProjetStoreState) => {
      state.selectedProjet = projet
    }),
    
    selectProjetById: (id) => set((state: ProjetStoreState) => {
      const projet = state.projets.find(p => p.id === id)
      state.selectedProjet = projet || null
    }),
    
    // ===== ACTIONS DE FILTRAGE =====
    setFilters: (filters) => set((state: ProjetStoreState) => {
      state.filters = { ...state.filters, ...filters }
      state.currentPage = 0 // Reset pagination
    }),
    
    clearFilters: () => set((state: ProjetStoreState) => {
      state.filters = {}
      state.searchTerm = ''
      state.currentPage = 0
    }),
    
    setSearchTerm: (term) => set((state: ProjetStoreState) => {
      state.searchTerm = term
      state.currentPage = 0
    }),
    
    // ===== ACTIONS DE TRI ET PAGINATION =====
    setSorting: (sortBy, sortOrder) => set((state: ProjetStoreState) => {
      state.sortBy = sortBy
      state.sortOrder = sortOrder || (state.sortOrder === 'asc' ? 'desc' : 'asc')
    }),
    
    setPage: (page) => set((state: ProjetStoreState) => {
      state.currentPage = Math.max(0, page)
    }),
    
    setPageSize: (size) => set((state: ProjetStoreState) => {
      state.pageSize = Math.max(1, size)
      state.currentPage = 0 // Reset page
    }),
    
    // ===== ACTIONS UTILITAIRES =====
    refreshStats: () => set((state: ProjetStoreState) => {
      state.stats = calculateStats(state.projets)
    }),
    
    invalidateCache: () => set((state: ProjetStoreState) => {
      cache.invalidate()
      state.lastFetch = 0
    }),
    
    syncWithServer: async () => {
      set((state: ProjetStoreState) => { state.isSyncing = true })
      try {
        await fetchProjets(set, get, { force: true })
      } finally {
        set((state: ProjetStoreState) => { state.isSyncing = false })
      }
    }
    
    // Les actions de base (setLoading, setError, etc.) sont automatiquement ajoutées par StoreUtils
  }),
  {
    name: 'projet-store',
    persist: false, // Les données projet viennent du serveur
    devtools: true,
    immer: true,
    subscriptions: true,
    version: '1.0.0'
  }
)

// ===== TYPES EXPORTÉS =====
export type { ProjetFilters, ProjetStoreState as ProjetState };
