import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Projet {
  id: string
  nom: string
  description: string
  statut: string
  client: string
  dateCreation: Date
  dateEcheance: Date
}

interface ProjetState {
  projets: Projet[]
  projetActuel: Projet | null
  loading: boolean
}

const initialState: ProjetState = {
  projets: [],
  projetActuel: null,
  loading: false,
}

// Fonction helper pour créer des dates
const createDate = (dateString: string | Date): Date => 
  typeof dateString === 'string' ? new Date(dateString) : dateString

const projetSlice = createSlice({
  name: 'projets',
  initialState,
  reducers: {
    addProjet: (state, action: PayloadAction<Omit<Projet, 'id'>>) => {
      const newProjet: Projet = {
        ...action.payload,
        id: Date.now().toString(),
        dateCreation: createDate(action.payload.dateCreation),
        dateEcheance: createDate(action.payload.dateEcheance),
      }
      state.projets.push(newProjet)
    },
    updateProjet: (state, action: PayloadAction<Projet>) => {
      const index = state.projets.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        const updatedProjet = {
          ...action.payload,
          dateCreation: createDate(action.payload.dateCreation),
          dateEcheance: createDate(action.payload.dateEcheance),
        }
        state.projets[index] = updatedProjet
      }
    },
    deleteProjet: (state, action: PayloadAction<string>) => {
      state.projets = state.projets.filter(p => p.id !== action.payload)
    },
    setProjetActuel: (state, action: PayloadAction<Projet | null>) => {
      state.projetActuel = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { addProjet, updateProjet, deleteProjet, setProjetActuel, setLoading } = projetSlice.actions
export default projetSlice.reducer
