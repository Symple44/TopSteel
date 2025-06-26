import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface StockItem {
  id: string
  nom: string
  reference: string
  categorie: string
  quantite: number
  unite: string
  seuilAlerte: number
  prix: number
  fournisseur: string
  emplacement: string
  dateEntree: string
  dateDerniereModification: string
}

interface StockState {
  items: StockItem[]
  loading: boolean
  error: string | null
  selectedItem: StockItem | null
  filters: {
    categorie: string
    fournisseur: string
    alerteStock: boolean
  }
  searchTerm: string
}

const initialState: StockState = {
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
  filters: {
    categorie: '',
    fournisseur: '',
    alerteStock: false
  },
  searchTerm: ''
}

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setItems: (state, action: PayloadAction<StockItem[]>) => {
      state.items = action.payload
    },
    addItem: (state, action: PayloadAction<StockItem>) => {
      state.items.push(action.payload)
    },
    updateItem: (state, action: PayloadAction<StockItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
    setSelectedItem: (state, action: PayloadAction<StockItem | null>) => {
      state.selectedItem = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<StockState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    updateQuantite: (state, action: PayloadAction<{ id: string; quantite: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id)
      if (item) {
        item.quantite = action.payload.quantite
        item.dateDerniereModification = new Date().toISOString()
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.searchTerm = ''
    }
  }
})

export const {
  setLoading,
  setError,
  setItems,
  addItem,
  updateItem,
  deleteItem,
  setSelectedItem,
  setFilters,
  setSearchTerm,
  updateQuantite,
  resetFilters
} = stockSlice.actions

export default stockSlice.reducer