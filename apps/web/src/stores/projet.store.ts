// apps/web/src/stores/projet.store.ts - VERSION CORRIGÉE
import { createStoreWithPersist } from '@/lib/store-utils';
import { projetService } from '@/services/projet.service';
import type {
  Projet,
  ProjetFilters
} from '@erp/types';
import { create } from 'zustand';

interface ProjetState {
  projets: Projet[]
  selectedProjet: Projet | null
  filters: ProjetFilters
  isLoading: boolean
  error: string | null
  
  fetchProjets: () => Promise<void>
  setSelectedProjet: (projet: Projet | null) => void
  setFilters: (filters: Partial<ProjetFilters>) => void
  clearError: () => void
  refetchWithFilters: () => Promise<void> // ✅ Nouvelle méthode explicite
}

export const useProjetStore = create<ProjetState>()(
  createStoreWithPersist(
    (set, get) => ({
      projets: [],
      selectedProjet: null,
      filters: {},
      isLoading: false,
      error: null,

      fetchProjets: async () => {
        const state = get()
        if (state.isLoading) return // ✅ Éviter les appels simultanés
        
        set({ isLoading: true, error: null })
        try {
          const response = await projetService.getAll(state.filters)
          
          set({ 
            projets: response.data, 
            isLoading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de chargement',
            isLoading: false 
          })
        }
      },

      setSelectedProjet: (projet) => set({ selectedProjet: projet }),
      
      // ✅ FIX CRITIQUE: Supprimer l'auto-fetch qui cause les boucles
      setFilters: (newFilters) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, ...newFilters }
        }))
        // ✅ NE PAS auto-fetch ici - laisser le composant décider
      },

      // ✅ Nouvelle méthode pour refetch explicite avec nouveaux filtres
      refetchWithFilters: async () => {
        await get().fetchProjets()
      },
      
      clearError: () => set({ error: null }),
    }),
    'projets',
    ['filters'] // ✅ Persister seulement les filtres, pas les données
  )
)