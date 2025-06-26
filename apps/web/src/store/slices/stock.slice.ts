import { create } from 'zustand'

interface Stock {
  id: string
  reference: string
  designation: string
  quantiteStock: number
  quantiteReservee: number
  quantiteDisponible: number
  quantiteMin: number
  quantiteMax: number
  type: string
}

interface StockState {
  stocks: Stock[]
  filteredStocks: Stock[]
  selectedStock: Stock | null
  filters: {
    search: string
    categorie: string
    statut: string
  }
  loading: boolean
  error: string | null
}

interface StockActions {
  setStocks: (stocks: Stock[]) => void
  addStock: (stock: Stock) => void
  updateStock: (id: string, updates: Partial<Stock>) => void
  deleteStock: (id: string) => void
  setSelectedStock: (stock: Stock | null) => void
  setFilters: (filters: Partial<StockState['filters']>) => void
  applyFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStockStore = create<StockState & StockActions>((set, get) => ({
  stocks: [],
  filteredStocks: [],
  selectedStock: null,
  filters: { search: '', categorie: '', statut: '' },
  loading: false,
  error: null,

  setStocks: (stocks) => {
    set({ stocks, filteredStocks: stocks })
    get().applyFilters()
  },

  addStock: (stock) => {
    const { stocks } = get()
    const newStocks = [...stocks, stock]
    set({ stocks: newStocks })
    get().applyFilters()
  },

  updateStock: (id, updates) => {
    const { stocks } = get()
    const newStocks = stocks.map(stock => 
      stock.id === id ? { ...stock, ...updates } : stock
    )
    set({ stocks: newStocks })
    get().applyFilters()
  },

  deleteStock: (id) => {
    const { stocks } = get()
    const newStocks = stocks.filter(stock => stock.id !== id)
    set({ stocks: newStocks })
    get().applyFilters()
  },

  setSelectedStock: (stock) => set({ selectedStock: stock }),

  setFilters: (newFilters) => {
    const { filters } = get()
    set({ filters: { ...filters, ...newFilters } })
    get().applyFilters()
  },

  applyFilters: () => {
    const { stocks, filters } = get()
    let filtered = stocks

    if (filters.search) {
      filtered = filtered.filter(stock => 
        stock.reference?.toLowerCase().includes(filters.search.toLowerCase()) ||
        stock.designation?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.categorie) {
      filtered = filtered.filter(stock => stock.type === filters.categorie)
    }

    set({ filteredStocks: filtered })
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
