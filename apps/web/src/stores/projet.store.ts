// apps/web/src/stores/projet.store.ts
import { create } from 'zustand'
import { createStoreWithPersist } from '@/lib/store-utils'
import type { Projet, ProjetFilters } from '@erp/types'

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
          // TODO: Implémenter projetService.getAll
          // Mock data pour le moment
          const mockProjets: Projet[] = [
            {
              id: '1',
              reference: 'PRJ-2024-001',
              description: 'Portail en acier',
              statut: 'en_cours',
              type: 'PORTAIL',
              priorite: 'NORMALE',
              montantHT: 5000,
              montantTTC: 6000,
              tauxTVA: 20,
              marge: 30,
              avancement: 65,
              dateCreation: new Date(),
              clientId: '1',
              client: { id: '1', nom: 'Client Test', email: 'test@test.com' },
              adresseChantier: { ville: 'Paris', codePostal: '75001' },
              documentsIds: [],
              ordresFabricationIds: []
            } as Projet
          ]
          
          set({ projets: mockProjets, isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de chargement',
            isLoading: false 
          })
        }
      },

      setSelectedProjet: (projet) => set({ selectedProjet: projet }),
      
      setFilters: (newFilters) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters }
        })
      },
      
      clearError: () => set({ error: null }),
    }),
    'projets',
    ['filters']
  )
)