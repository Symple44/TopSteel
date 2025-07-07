/**
 * 📋 STORE PROJETS CORRIGÉ - TopSteel ERP
 * Store projets avec actions async directes (sans createAsyncAction)
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
import { ClientType, ProjetPriorite, ProjetStatut, ProjetType } from '@erp/types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

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
  stats: null
}

// ===== CACHE ET UTILITAIRES =====

const projetCache = StoreUtils.createCache<string, StoreProjet[]>(300000) // 5 minutes
const statsCache = StoreUtils.createCache<string, ProjetStats>(60000) // 1 minute

// ===== SERVICE API SIMULÉ =====

const projetService = {
  async fetchProjets(filters?: ProjetFilters): Promise<StoreProjet[]> {
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Retourner des données mockées
    return [
      {
        id: 'proj_001',
        reference: 'PRJ-2024-001',
        description: 'Portail résidentiel en acier',
        type: ProjetType.PORTAIL,
        statut: ProjetStatut.EN_COURS,
        priorite: ProjetPriorite.NORMALE,
        dateCreation: new Date('2024-01-15'),
        dateDebut: new Date('2024-01-20'),
        dateFinPrevue: new Date('2024-02-15'),
        clientId: 'client_001',
        client: {
          id: 'client_001',
          nom: 'Dupont',
          email: 'dupont@example.com',
          type: ClientType.PARTICULIER,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActif: true,
          adresse: {
            rue: '123 Rue de la Paix',
            ville: 'Paris',
            codePostal: '75001',
            pays: 'France'
          },
          contact: {
            nom: 'Jean Dupont',
            telephone: '0102030405',
            email: 'dupont@example.com'
          },
          telephone: '0102030405'
        },
        montantHT: 5000,
        montantTTC: 6000,
        tauxTVA: 20,
        marge: 1000,
        avancement: 45,
        adresseChantier: {
          rue: '123 Rue de la Paix',
          ville: 'Paris',
          codePostal: '75001'
        },
        documentsIds: [],
        ordresFabricationIds: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        id: 'proj_002',
        reference: 'PRJ-2024-002',
        description: 'Escalier métallique industriel',
        type: ProjetType.ESCALIER,
        statut: ProjetStatut.DEVIS,
        priorite: ProjetPriorite.HAUTE,
        dateCreation: new Date('2024-01-20'),
        dateDebut: new Date('2024-02-01'),
        dateFinPrevue: new Date('2024-03-01'),
        clientId: 'client_002',
        client: {
          id: 'client_002',
          nom: 'SARL Industrielle',
          email: 'contact@sarl-industrielle.com',
          type: ClientType.PROFESSIONNEL,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActif: true,
          adresse: {
            rue: '456 Zone Industrielle',
            ville: 'Lyon',
            codePostal: '69000',
            pays: 'France'
          },
          contact: {
            nom: 'Responsable SARL',
            telephone: '0405060708',
            email: 'contact@sarl-industrielle.com'
          },
          telephone: '0405060708'
        },
        montantHT: 12000,
        montantTTC: 14400,
        tauxTVA: 20,
        marge: 2500,
        avancement: 0,
        adresseChantier: {
          rue: '456 Zone Industrielle',
          ville: 'Lyon',
          codePostal: '69000'
        },
        documentsIds: [],
        ordresFabricationIds: [],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date()
      }
    ]
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
      ordresFabricationIds: data.ordresFabricationIds || [],
      
      // Valeurs par défaut avec les bons types d'enum
      type: data.type || 'AUTRE',
      statut: data.statut || 'brouillon',
      priorite: data.priorite || 'NORMALE',
      dateCreation: data.dateCreation || now
    } as StoreProjet
  },

  async updateProjet(id: string, updates: Partial<StoreProjet>): Promise<StoreProjet> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
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
      total: 15,
      parStatut: { 
        'en_cours': 8, 
        'termine': 5, 
        'devis': 2 
      },
      parPriorite: { 
        'NORMALE': 10, 
        'HAUTE': 4, 
        'URGENTE': 1 
      },
      parType: { 
        'PORTAIL': 6,
        'ESCALIER': 4, 
        'CLOTURE': 3,
        'STRUCTURE': 2 
      },
      enRetard: 2,
      terminesTemps: 5,
      avancementMoyen: 65,
      chiffreAffaireMensuel: 85000,
      chiffreAffaireAnnuel: 950000,
      margeGlobale: 18.5,
      projetsActifs: 8,
      nouveauxCeMois: 3
    }
  }
}

// ===== DÉFINITION DU STORE =====

const createProjetStoreActions: StoreCreator<ProjetState, ProjetStoreActions> = (set, get) => ({
  // ===== ACTIONS DE BASE =====
  setLoading: (loading: boolean) => {
    set((state) => {
      state.loading = loading
      state.lastUpdate = Date.now()
    })
  },

  setError: (error: string | null) => {
    set((state) => {
      state.error = error
      state.loading = false
      state.lastUpdate = Date.now()
    })
  },

  clearError: () => {
    set((state) => {
      state.error = null
      state.lastUpdate = Date.now()
    })
  },

  reset: () => {
    set((state) => {
      Object.assign(state, {
        ...initialProjetState,
        loading: false,
        error: null,
        lastUpdate: Date.now()
      })
    })
  },

  // ===== ACTIONS DE DONNÉES =====
  fetchProjets: async (options = {}) => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
        state.isSyncing = true
      })

      const { force = false, filters } = options
      const cacheKey = JSON.stringify(filters || {})
      
      // Vérifier le cache si pas de force
      if (!force) {
        const cached = projetCache.get(cacheKey)
        if (cached) {
          set((state) => {
            state.projets = cached
            state.totalCount = cached.length
            state.loading = false
            state.isSyncing = false
          })
          return cached
        }
      }
      
      const projets = await projetService.fetchProjets(filters)
      projetCache.set(cacheKey, projets)
      
      set((state) => {
        state.projets = projets
        state.totalCount = projets.length
        state.lastFetch = Date.now()
        state.loading = false
        state.isSyncing = false
        state.lastUpdate = Date.now()
      })
      
      return projets
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors du chargement des projets'
      
      set((state) => {
        state.loading = false
        state.error = errorMsg
        state.isSyncing = false
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur fetch projets:', error)
      return []
    }
  },

  createProjet: async (projetData) => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
      })

      const newProjet = await projetService.createProjet(projetData)
      
      set((state) => {
        state.projets.unshift(newProjet)
        state.totalCount++
        state.loading = false
        state.lastUpdate = Date.now()
      })
      
      // Invalider le cache
      projetCache.delete()
      statsCache.delete()
      
      return newProjet
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors de la création du projet'
      
      set((state) => {
        state.loading = false
        state.error = errorMsg
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur création projet:', error)
      return null
    }
  },

  updateProjet: async (id, updates) => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
      })

      const updatedProjet = await projetService.updateProjet(id, updates)
      
      set((state) => {
        const index = state.projets.findIndex(p => p.id === id)
        if (index !== -1) {
          state.projets[index] = { ...state.projets[index], ...updatedProjet }
        }
        
        // Mettre à jour le projet sélectionné si nécessaire
        if (state.selectedProjet?.id === id) {
          state.selectedProjet = { ...state.selectedProjet, ...updatedProjet }
        }
        
        state.loading = false
        state.lastUpdate = Date.now()
      })
      
      // Invalider les caches
      projetCache.delete()
      statsCache.delete()
      
      return updatedProjet
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du projet'
      
      set((state) => {
        state.loading = false
        state.error = errorMsg
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur mise à jour projet:', error)
      return null
    }
  },

  deleteProjet: async (id) => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
      })

      const success = await projetService.deleteProjet(id)
      
      if (success) {
        set((state) => {
          state.projets = state.projets.filter(p => p.id !== id)
          state.totalCount--
          
          // Désélectionner si c'était le projet supprimé
          if (state.selectedProjet?.id === id) {
            state.selectedProjet = null
          }
          
          state.loading = false
          state.lastUpdate = Date.now()
        })
        
        // Invalider les caches
        projetCache.delete()
        statsCache.delete()
      }
      
      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors de la suppression du projet'
      
      set((state) => {
        state.loading = false
        state.error = errorMsg
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur suppression projet:', error)
      return false
    }
  },

  duplicateProjet: async (id) => {
    try {
      const currentState = get()
      const originalProjet = currentState.projets.find(p => p.id === id)
      
      if (!originalProjet) {
        throw new Error('Projet non trouvé')
      }
      
      const { id: _, createdAt: __, updatedAt: ___, ...projetData } = originalProjet
      const duplicatedProjet = await get().createProjet({
        ...projetData,
        reference: `${projetData.reference}_COPIE`,
        description: `Copie de ${projetData.description}`
      })
      
      return duplicatedProjet
    } catch (error) {
      console.error('Erreur duplication projet:', error)
      return null
    }
  },

  // ===== ACTIONS DE SÉLECTION =====
  setSelectedProjet: (projet) => {
    set((state) => {
      state.selectedProjet = projet
      state.lastUpdate = Date.now()
    })
  },

  selectProjetById: (id) => {
    set((state) => {
      const projet = state.projets.find(p => p.id === id)
      state.selectedProjet = projet || null
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS DE FILTRAGE =====
  setFilters: (filters) => {
    set((state) => {
      state.filters = { ...state.filters, ...filters }
      state.currentPage = 1 // Reset pagination
      state.lastUpdate = Date.now()
    })
  },

  clearFilters: () => {
    set((state) => {
      state.filters = {}
      state.searchTerm = ''
      state.currentPage = 1
      state.lastUpdate = Date.now()
    })
  },

  setSearchTerm: (term) => {
    set((state) => {
      state.searchTerm = term
      state.currentPage = 1
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS DE TRI ET PAGINATION =====
  setSorting: (sortBy, sortOrder = 'asc') => {
    set((state) => {
      state.sortBy = sortBy
      state.sortOrder = sortOrder
      state.lastUpdate = Date.now()
    })
  },

  setPage: (page) => {
    set((state) => {
      state.currentPage = page
      state.lastUpdate = Date.now()
    })
  },

  setPageSize: (size) => {
    set((state) => {
      state.pageSize = size
      state.currentPage = 1 // Reset à la première page
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS DE CACHE =====
  invalidateCache: () => {
    set((state) => {
      projetCache.delete()
      statsCache.delete()
      state.lastFetch = 0
      state.stats = null
      state.lastUpdate = Date.now()
    })
  },

  refreshStats: async () => {
    try {
      set((state) => {
        state.loading = true
        state.error = null
      })

      // Vérifier le cache d'abord
      const cached = statsCache.get('stats')
      if (cached) {
        set((state) => {
          state.stats = cached
          state.loading = false
        })
        return
      }
      
      const stats = await projetService.getStats()
      statsCache.set('stats', stats)
      
      set((state) => {
        state.stats = stats
        state.loading = false
        state.lastUpdate = Date.now()
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques'
      
      set((state) => {
        state.loading = false
        state.error = errorMsg
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur refresh stats:', error)
    }
  }
})

// ===== CRÉATION DU STORE =====

export const useProjetStore = create<ProjetStore>()(
  immer(
    devtools(
      (set, get) => ({
        ...initialProjetState,
        ...createProjetStoreActions(set, get)
      }),
      { name: 'projet-store' }
    )
  )
)

// ===== HOOKS SÉLECTEURS =====

export const useProjetLoading = () => useProjetStore(state => state.loading)
export const useProjetError = () => useProjetStore(state => state.error)
export const useProjets = () => useProjetStore(state => state.projets)
export const useSelectedProjet = () => useProjetStore(state => state.selectedProjet)
export const useProjetFilters = () => useProjetStore(state => state.filters)
export const useProjetStats = () => useProjetStore(state => state.stats)

// ===== EXPORTS =====
export type { ProjetState, ProjetStore, ProjetStoreActions }

