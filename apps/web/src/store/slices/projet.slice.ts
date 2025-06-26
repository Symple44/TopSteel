import { Projet, ProjetFilters } from '@erp/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ProjetState {
  projets: Projet[]
  selectedProjet: Projet | null
  loading: boolean
  error: string | null
  filters: ProjetFilters
  searchTerm: string
}

const initialState: ProjetState = {
  projets: [],
  selectedProjet: null,
  loading: false,
  error: null,
  filters: {
    statut: "",
    client: "",
    dateDebut: "",
    dateFin: ""
  },
  searchTerm: ""
}

const projetSlice = createSlice({
  name: 'projets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setProjets: (state, action: PayloadAction<Projet[]>) => {
      state.projets = action.payload
    },
    addProjet: (state, action: PayloadAction<Projet>) => {
      state.projets.push(action.payload)
    },
    updateProjet: (state, action: PayloadAction<Projet>) => {
      const index = state.projets.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.projets[index] = action.payload
      }
    },
    deleteProjet: (state, action: PayloadAction<string>) => {
      state.projets = state.projets.filter(p => p.id !== action.payload)
    },
    setSelectedProjet: (state, action: PayloadAction<Projet | null>) => {
      state.selectedProjet = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<ProjetFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.searchTerm = ""
    }
  }
})

export const {
  setLoading,
  setError,
  setProjets,
  addProjet,
  updateProjet,
  deleteProjet,
  setSelectedProjet,
  setFilters,
  setSearchTerm,
  resetFilters
} = projetSlice.actions

export default projetSlice.reducer