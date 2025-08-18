import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '../components/products/ProductCard'

export interface CartItem {
  product: Product
  quantity: number
  selectedOptions?: Record<string, any>
  addedAt: Date
  reservationId?: string
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  lastUpdated: Date | null
  appliedCoupon: {
    code: string
    discount: number
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  } | null
  shippingMethod: {
    id: string
    name: string
    cost: number
    estimatedDays: number
  } | null
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  lastUpdated: null,
  appliedCoupon: null,
  shippingMethod: null,
}

// Helper functions
const calculateItemTotal = (item: CartItem): number => {
  return item.product.price * item.quantity
}

const findItemIndex = (
  items: CartItem[],
  productId: string,
  options?: Record<string, any>
): number => {
  return items.findIndex(
    (item) =>
      item.product.id === productId &&
      JSON.stringify(item.selectedOptions || {}) === JSON.stringify(options || {})
  )
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        product: Product
        quantity: number
        options?: Record<string, any>
      }>
    ) => {
      const { product, quantity, options } = action.payload
      const existingItemIndex = findItemIndex(state.items, product.id, options)

      if (existingItemIndex !== -1) {
        // Update quantity if item already exists
        state.items[existingItemIndex].quantity += quantity
      } else {
        // Add new item
        state.items.push({
          product,
          quantity,
          selectedOptions: options,
          addedAt: new Date(),
        })
      }

      state.lastUpdated = new Date()
      state.isOpen = true
    },

    updateQuantity: (
      state,
      action: PayloadAction<{
        productId: string
        quantity: number
        options?: Record<string, any>
      }>
    ) => {
      const { productId, quantity, options } = action.payload
      const itemIndex = findItemIndex(state.items, productId, options)

      if (itemIndex !== -1) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items.splice(itemIndex, 1)
        } else {
          state.items[itemIndex].quantity = quantity
        }
        state.lastUpdated = new Date()
      }
    },

    removeFromCart: (
      state,
      action: PayloadAction<{
        productId: string
        options?: Record<string, any>
      }>
    ) => {
      const { productId, options } = action.payload
      const itemIndex = findItemIndex(state.items, productId, options)

      if (itemIndex !== -1) {
        state.items.splice(itemIndex, 1)
        state.lastUpdated = new Date()
      }
    },

    clearCart: (state) => {
      state.items = []
      state.appliedCoupon = null
      state.shippingMethod = null
      state.lastUpdated = new Date()
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },

    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
    },

    applyCoupon: (
      state,
      action: PayloadAction<{
        code: string
        discount: number
        type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
      }>
    ) => {
      state.appliedCoupon = action.payload
      state.lastUpdated = new Date()
    },

    removeCoupon: (state) => {
      state.appliedCoupon = null
      state.lastUpdated = new Date()
    },

    setShippingMethod: (
      state,
      action: PayloadAction<{
        id: string
        name: string
        cost: number
        estimatedDays: number
      }>
    ) => {
      state.shippingMethod = action.payload
      state.lastUpdated = new Date()
    },

    syncCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
      state.lastUpdated = new Date()
    },

    setReservationId: (
      state,
      action: PayloadAction<{
        productId: string
        reservationId: string
        options?: Record<string, any>
      }>
    ) => {
      const { productId, reservationId, options } = action.payload
      const itemIndex = findItemIndex(state.items, productId, options)

      if (itemIndex !== -1) {
        state.items[itemIndex].reservationId = reservationId
      }
    },
  },
})

// Actions
export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  toggleCart,
  setCartOpen,
  applyCoupon,
  removeCoupon,
  setShippingMethod,
  syncCart,
  setReservationId,
} = cartSlice.actions

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0)

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + calculateItemTotal(item), 0)

export const selectCartDiscount = (state: { cart: CartState }) => {
  if (!state.cart.appliedCoupon) return 0

  const subtotal = selectCartSubtotal(state)
  const { type, discount } = state.cart.appliedCoupon

  switch (type) {
    case 'PERCENTAGE':
      return (subtotal * discount) / 100
    case 'FIXED_AMOUNT':
      return Math.min(discount, subtotal)
    case 'FREE_SHIPPING':
      return state.cart.shippingMethod?.cost || 0
    default:
      return 0
  }
}

export const selectShippingCost = (state: { cart: CartState }) => {
  if (state.cart.appliedCoupon?.type === 'FREE_SHIPPING') return 0
  return state.cart.shippingMethod?.cost || 0
}

export const selectCartTotal = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state)
  const discount = selectCartDiscount(state)
  const shipping = selectShippingCost(state)

  return Math.max(0, subtotal - discount + shipping)
}

export const selectIsCartOpen = (state: { cart: CartState }) => state.cart.isOpen
export const selectAppliedCoupon = (state: { cart: CartState }) => state.cart.appliedCoupon
export const selectShippingMethod = (state: { cart: CartState }) => state.cart.shippingMethod

export const selectCartItemByProduct =
  (productId: string, options?: Record<string, any>) => (state: { cart: CartState }) => {
    return state.cart.items.find(
      (item) =>
        item.product.id === productId &&
        JSON.stringify(item.selectedOptions || {}) === JSON.stringify(options || {})
    )
  }

export default cartSlice.reducer
