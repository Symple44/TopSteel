import { StateCreator } from 'zustand'
import { Projet, ProjetFilters } from '@/types'

export interface ProjetSlice {
  // État
  projets: Projet[]
  selectedProjet: Projet | null
  projetFilters: ProjetFilters
  isLoadingProjets: boolean

  // Actions
  setProjets: (projets: Projet[]) => void
  addProjet: (projet: Projet) => void
  updateProjet: (id: string, updates: Partial<Projet>) => void
  deleteProjet: (id: string) => void
  setSelectedProjet: (projet: Projet | null) => void
  setProjetFilters: (filters: Partial<ProjetFilters>) => void
  resetProjetFilters: () => void
  setLoadingProjets: (isLoading: boolean) => void
}

const defaultFilters: ProjetFilters = {
  search: '',
  statut: [],
  clientId: undefined,
  dateDebut: undefined,
  dateFin: undefined,
  montantMin: undefined,
  montantMax: undefined,
}

export const createProjetSlice: StateCreator<ProjetSlice> = (set, get) => ({
  // État initial
  projets: [],
  selectedProjet: null,
  projetFilters: defaultFilters,
  isLoadingProjets: false,

  // Actions
  setProjets: (projets) => set({ projets }),

  addProjet: (projet) =>
    set((state) => ({
      projets: [projet, ...state.projets],
    })),

  updateProjet: (id, updates) =>
    set((state) => ({
      projets: state.projets.map((projet) =>
        projet.id === id ? { ...projet, ...updates } : projet
      ),
      selectedProjet:
        state.selectedProjet?.id === id
          ? { ...state.selectedProjet, ...updates }
          : state.selectedProjet,
    })),

  deleteProjet: (id) =>
    set((state) => ({
      projets: state.projets.filter((projet) => projet.id !== id),
      selectedProjet: state.selectedProjet?.id === id ? null : state.selectedProjet,
    })),

  setSelectedProjet: (projet) => set({ selectedProjet: projet }),

  setProjetFilters: (filters) =>
    set((state) => ({
      projetFilters: { ...state.projetFilters, ...filters },
    })),

  resetProjetFilters: () => set({ projetFilters: defaultFilters }),

  setLoadingProjets: (isLoading) => set({ isLoadingProjets: isLoading }),
})