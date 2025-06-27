import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

interface StockItem {
  id: string
  nom: string
  quantite: number
  prix: number
}

interface StockState {
  items: StockItem[]
  loading: boolean
}

const initialState: StockState = {
  items: [],
  loading: false,
}

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    addStockItem: (state, action: PayloadAction<Omit<StockItem, 'id'>>) => {
      const newItem: StockItem = {
        ...action.payload,
        id: Date.now().toString(),
      }
      state.items.push(newItem)
    },
    updateStockItem: (state, action: PayloadAction<StockItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteStockItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { addStockItem, updateStockItem, deleteStockItem, setLoading } = stockSlice.actions
export default stockSlice.reducer