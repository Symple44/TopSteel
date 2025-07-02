// apps/web/src/stores/projet.store.ts - VERSION STABLE CORRIGÉE
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Projet, ProjetFilters } from '@erp/types'
import { api } from '@/lib/api'

interface ProjetState {
  projets: Projet[]
  selectedProjet: Projet | null
  filters: ProjetFilters
  isLoading: boolean
  error: string | null
  lastFetch: number
  
  // Actions
  fetchProjets: () => Promise<void>
  setSelectedProjet: (projet: Projet | null) => void
  setFilters: (filters: ProjetFilters) => void
  clearError: () => void
  resetState: () => void
}

// État initial stable
const initialState = {
  projets: [] as Projet[],
  selectedProjet: null as Projet | null,
  filters: {} as ProjetFilters,
  isLoading: false,
  error: null as string | null,
  lastFetch: 0,
}

export const useProjetStore = create<ProjetState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchProjets: async () => {
        const state = get()
        const now = Date.now()
        
        // Cache simple de 30 secondes
        if (state.lastFetch && (now - state.lastFetch) < 30000) {
          return
        }

        set({ isLoading: true, error: null })

        try {
          const projets = await api.projets.getAll(state.filters)
          
          set({ 
            projets: projets || [],
            isLoading: false,
            lastFetch: now
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            isLoading: false,
            projets: [] // S'assurer qu'on a toujours un tableau
          })
        }
      },

      setSelectedProjet: (projet) => {
        set({ selectedProjet: projet })
      },

      setFilters: (filters) => {
        set({ 
          filters: filters,
          lastFetch: 0 // Force refetch avec nouveaux filtres
        })
      },

      clearError: () => {
        set({ error: null })
      },

      resetState: () => {
        set(initialState)
      },
    }),
    { name: 'projet-store' }
  )
)
