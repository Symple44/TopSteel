// apps/web/src/stores/projet.store.ts
import { createStoreWithPersist } from '@/lib/store-utils';
import { projetService } from '@/services/projet.service'; // 
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
        set({ isLoading: true, error: null })
        try {
          const response = await projetService.getAll(get().filters)
          
          // ✅ Les données du service sont déjà aux bons types, on les utilise directement
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
      
      setFilters: (newFilters) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, ...newFilters }
        }))
        // ✅ Recharger les projets quand les filtres changent
        get().fetchProjets()
      },
      
      clearError: () => set({ error: null }),
    }),
    'projets',
    ['filters']
  )
)