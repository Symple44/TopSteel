import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '../components/products/ProductCard'

export interface WishlistItem {
  product: Product
  addedAt: Date
  notes?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface WishlistState {
  items: WishlistItem[]
  lastUpdated: Date | null
}

const initialState: WishlistState = {
  items: [],
  lastUpdated: null,
}

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (
      state,
      action: PayloadAction<{
        product: Product
        notes?: string
        priority?: 'low' | 'medium' | 'high'
      }>
    ) => {
      const { product, notes, priority } = action.payload

      // Check if product already exists in wishlist
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id)

      if (existingIndex === -1) {
        // Add new item
        state.items.push({
          product,
          addedAt: new Date(),
          notes,
          priority,
        })
        state.lastUpdated = new Date()
      }
    },

    removeFromWishlist: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      state.items = state.items.filter((item) => item.product.id !== productId)
      state.lastUpdated = new Date()
    },

    updateWishlistItem: (
      state,
      action: PayloadAction<{
        productId: string
        notes?: string
        priority?: 'low' | 'medium' | 'high'
      }>
    ) => {
      const { productId, notes, priority } = action.payload
      const item = state.items.find((item) => item.product.id === productId)

      if (item) {
        if (notes !== undefined) {
          item.notes = notes
        }
        if (priority !== undefined) {
          item.priority = priority
        }
        state.lastUpdated = new Date()
      }
    },

    clearWishlist: (state) => {
      state.items = []
      state.lastUpdated = new Date()
    },

    moveToCart: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      state.items = state.items.filter((item) => item.product.id !== productId)
      state.lastUpdated = new Date()
    },

    syncWishlist: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload
      state.lastUpdated = new Date()
    },

    sortWishlist: (state, action: PayloadAction<'date' | 'price' | 'priority' | 'name'>) => {
      const sortBy = action.payload

      switch (sortBy) {
        case 'date':
          state.items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          break
        case 'price':
          state.items.sort((a, b) => a.product.price - b.product.price)
          break
        case 'priority': {
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
          state.items.sort(
            (a, b) =>
              (priorityOrder[b.priority ?? 'low'] ?? 0) - (priorityOrder[a.priority ?? 'low'] ?? 0)
          )
          break
        }
        case 'name':
          state.items.sort((a, b) => a.product.name.localeCompare(b.product.name))
          break
      }

      state.lastUpdated = new Date()
    },
  },
})

// Actions
export const {
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist,
  moveToCart,
  syncWishlist,
  sortWishlist,
} = wishlistSlice.actions

// Selectors
export const selectWishlistItems = (state: { wishlist: WishlistState }) => state.wishlist.items
export const selectWishlistCount = (state: { wishlist: WishlistState }) =>
  state.wishlist.items.length

export const selectIsInWishlist = (productId: string) => (state: { wishlist: WishlistState }) =>
  state.wishlist.items.some((item) => item.product.id === productId)

export const selectWishlistItemByProduct =
  (productId: string) => (state: { wishlist: WishlistState }) =>
    state.wishlist.items.find((item) => item.product.id === productId)

export const selectWishlistByPriority =
  (priority: 'low' | 'medium' | 'high') => (state: { wishlist: WishlistState }) =>
    state.wishlist.items.filter((item) => item.priority === priority)

export const selectWishlistTotal = (state: { wishlist: WishlistState }) =>
  state.wishlist.items.reduce((total, item) => total + item.product.price, 0)

export default wishlistSlice.reducer
