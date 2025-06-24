import { StateCreator } from 'zustand'
import { Stock, Produit, MouvementStock, StockFilters } from '@/types'

export interface StockSlice {
  // État
  stocks: Stock[]
  produits: Produit[]
  mouvements: MouvementStock[]
  stocksAlertes: Stock[]
  selectedStock: Stock | null
  stockFilters: StockFilters
  isLoadingStocks: boolean

  // Actions
  setStocks: (stocks: Stock[]) => void
  setProduits: (produits: Produit[]) => void
  setMouvements: (mouvements: MouvementStock[]) => void
  updateStock: (id: string, updates: Partial<Stock>) => void
  addMouvement: (mouvement: MouvementStock) => void
  setStocksAlertes: (stocks: Stock[]) => void
  setSelectedStock: (stock: Stock | null) => void
  setStockFilters: (filters: Partial<StockFilters>) => void
  resetStockFilters: () => void
  setLoadingStocks: (isLoading: boolean) => void

  // Helpers
  getStockCritique: () => Stock[]
  getProduitById: (id: string) => Produit | undefined
}

const defaultFilters: StockFilters = {
  search: '',
  categorie: [],
  stockCritique: false,
  fournisseurId: undefined,
}

export const createStockSlice: StateCreator<StockSlice> = (set, get) => ({
  // État initial
  stocks: [],
  produits: [],
  mouvements: [],
  stocksAlertes: [],
  selectedStock: null,
  stockFilters: defaultFilters,
  isLoadingStocks: false,

  // Actions
  setStocks: (stocks) => set({ stocks }),

  setProduits: (produits) => set({ produits }),

  setMouvements: (mouvements) => set({ mouvements }),

  updateStock: (id, updates) =>
    set((state) => ({
      stocks: state.stocks.map((stock) =>
        stock.id === id ? { ...stock, ...updates } : stock
      ),
      selectedStock:
        state.selectedStock?.id === id
          ? { ...state.selectedStock, ...updates }
          : state.selectedStock,
    })),

  addMouvement: (mouvement) =>
    set((state) => {
      const stock = state.stocks.find((s) => s.stockId === mouvement.stockId)
      if (!stock) return state

      const updatedStock = { ...stock }

      switch (mouvement.type) {
        case 'ENTREE':
          updatedStock.quantiteDisponible += mouvement.quantite
          break
        case 'SORTIE':
          updatedStock.quantiteDisponible -= mouvement.quantite
          break
        case 'RESERVATION':
          updatedStock.quantiteReservee += mouvement.quantite
          break
        case 'AJUSTEMENT':
          updatedStock.quantiteDisponible = mouvement.quantite
          break
      }

      return {
        mouvements: [mouvement, ...state.mouvements],
        stocks: state.stocks.map((s) =>
          s.id === stock.id ? updatedStock : s
        ),
      }
    }),

  setStocksAlertes: (stocks) => set({ stocksAlertes: stocks }),

  setSelectedStock: (stock) => set({ selectedStock: stock }),

  setStockFilters: (filters) =>
    set((state) => ({
      stockFilters: { ...state.stockFilters, ...filters },
    })),

  resetStockFilters: () => set({ stockFilters: defaultFilters }),

  setLoadingStocks: (isLoading) => set({ isLoadingStocks: isLoading }),

  // Helpers
  getStockCritique: () => {
    const { stocks } = get()
    return stocks.filter(
      (stock) => stock.quantiteDisponible <= stock.quantiteMinimale
    )
  },

  getProduitById: (id) => {
    const { produits } = get()
    return produits.find((produit) => produit.id === id)
  },
})