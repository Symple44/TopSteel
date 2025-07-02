// apps/web/src/stores/projet.store.ts - VERSION CORRIGÉE ANTI-BOUCLES
import { createStoreWithPersist } from '@/lib/store-utils'
import { projetService } from '@/services/projet.service'
import type { Projet, ProjetFilters } from '@erp/types'
import { create } from 'zustand'

interface ProjetState {
  projets: Projet[]
  selectedProjet: Projet | null
  filters: ProjetFilters
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null // ✅ Ajout pour cache timing
  
  fetchProjets: () => Promise<void>
  setSelectedProjet: (projet: Projet | null) => void
  setFilters: (filters: Partial<ProjetFilters>) => void
  clearError: () => void
  refreshProjets: () => Promise<void> // ✅ Méthode explicite pour refresh
  reset: () => void // ✅ Méthode pour reset complet
}

export const useProjetStore = create<ProjetState>()(
  createStoreWithPersist(
    (set, get) => ({
      projets: [],
      selectedProjet: null,
      filters: {},
      isLoading: false,
      error: null,
      lastFetchTime: null,

      // ✅ FIX CRITIQUE #1: FetchProjets avec protection anti-spam
      fetchProjets: async () => {
        const state = get()
        
        // ✅ Protection anti-appels simultanés
        if (state.isLoading) {
          console.warn('FetchProjets déjà en cours, ignoré')
          return
        }
        
        // ✅ Protection anti-spam (minimum 1 seconde entre appels)
        const now = Date.now()
        if (state.lastFetchTime && (now - state.lastFetchTime) < 1000) {
          console.warn('FetchProjets trop rapide, ignoré')
          return
        }
        
        set((state) => ({ 
          ...state, 
          isLoading: true, 
          error: null,
          lastFetchTime: now
        }))
        
        try {
          const response = await projetService.getAll(state.filters)
          
          set((state) => ({ 
            ...state,
            projets: response.data, 
            isLoading: false 
          }))
          
        } catch (error) {
          set((state) => ({ 
            ...state,
            error: error instanceof Error ? error.message : 'Erreur de chargement',
            isLoading: false 
          }))
        }
      },

      setSelectedProjet: (projet) => {
        set((state) => ({ 
          ...state, 
          selectedProjet: projet 
        }))
      },
      
      // ✅ FIX CRITIQUE #2: setFilters SANS auto-fetch 
      setFilters: (newFilters) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, ...newFilters }
        }))
        // ✅ SUPPRESSION de l'auto-fetch - laisse le composant décider
      },

      // ✅ FIX CRITIQUE #3: Méthode explicite pour refresh avec nouveaux filtres
      refreshProjets: async () => {
        const state = get()
        
        // ✅ Reset les projets existants pour forcer reload
        set((state) => ({ 
          ...state, 
          projets: [],
          lastFetchTime: null 
        }))
        
        await state.fetchProjets()
      },

      // ✅ FIX CRITIQUE #4: Reset complet du store
      reset: () => {
        set((state) => ({
          ...state,
          projets: [],
          selectedProjet: null,
          isLoading: false,
          error: null,
          lastFetchTime: null
        }))
      },
      
      clearError: () => {
        set((state) => ({ 
          ...state, 
          error: null 
        }))
      },
    }),
    'projets',
    ['filters'] // ✅ Persister SEULEMENT les filtres, pas les données
  )
)