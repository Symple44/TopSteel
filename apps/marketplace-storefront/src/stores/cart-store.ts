import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/lib/api/storefront'

export interface CartItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: Date
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  tenant: string | null
  
  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setTenant: (tenant: string) => void
  
  // Computed
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (productId: string) => number
  hasItem: (productId: string) => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      tenant: null,

      addItem: (product: Product, quantity = 1) => {
        const state = get()
        const existingItemIndex = state.items.findIndex(item => item.product.id === product.id)
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.items]
          const existingItem = updatedItems[existingItemIndex]
          const newQuantity = existingItem.quantity + quantity
          const maxQuantity = product.stockDisponible || 999
          
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: Math.min(newQuantity, maxQuantity),
            totalPrice: Math.min(newQuantity, maxQuantity) * existingItem.unitPrice,
          }
          
          set({ items: updatedItems })
        } else {
          // Add new item
          const unitPrice = product.calculatedPrice || product.basePrice
          const maxQuantity = product.stockDisponible || 999
          const finalQuantity = Math.min(quantity, maxQuantity)
          
          const newItem: CartItem = {
            id: `${product.id}_${Date.now()}`,
            product,
            quantity: finalQuantity,
            unitPrice,
            totalPrice: finalQuantity * unitPrice,
            addedAt: new Date(),
          }
          
          set({ items: [...state.items, newItem] })
        }
      },

      removeItem: (itemId: string) => {
        const state = get()
        set({ items: state.items.filter(item => item.id !== itemId) })
      },

      updateQuantity: (itemId: string, quantity: number) => {
        const state = get()
        if (quantity <= 0) {
          set({ items: state.items.filter(item => item.id !== itemId) })
          return
        }
        
        const updatedItems = state.items.map(item => {
          if (item.id === itemId) {
            const maxQuantity = item.product.stockDisponible || 999
            const finalQuantity = Math.min(quantity, maxQuantity)
            
            return {
              ...item,
              quantity: finalQuantity,
              totalPrice: finalQuantity * item.unitPrice,
            }
          }
          return item
        })
        
        set({ items: updatedItems })
      },

      clearCart: () => {
        set({ items: [], isOpen: false })
      },

      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }))
      },

      setTenant: (tenant: string) => {
        const state = get()
        // Clear cart if switching tenant
        if (state.tenant && state.tenant !== tenant) {
          set({ tenant, items: [], isOpen: false })
        } else {
          set({ tenant })
        }
      },

      getTotalItems: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.totalPrice, 0)
      },

      getItemCount: (productId: string) => {
        const state = get()
        const item = state.items.find(item => item.product.id === productId)
        return item ? item.quantity : 0
      },

      hasItem: (productId: string) => {
        const state = get()
        return state.items.some(item => item.product.id === productId)
      },
    }),
    {
      name: 'marketplace-cart',
      // Only persist cart items, not UI state
      partialize: (state) => ({
        items: state.items,
        tenant: state.tenant,
      }),
      // Rehydrate cart state on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure dates are properly restored
          state.items = state.items.map(item => ({
            ...item,
            addedAt: new Date(item.addedAt),
          }))
        }
      },
    }
  )
)

// Hook for easy access to cart actions
export const useCart = () => {
  const store = useCartStore()
  return {
    // State
    items: store.items,
    isOpen: store.isOpen,
    totalItems: store.getTotalItems(),
    totalPrice: store.getTotalPrice(),
    
    // Actions
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    toggleCart: store.toggleCart,
    setTenant: store.setTenant,
    getItemCount: store.getItemCount,
    hasItem: store.hasItem,
  }
}