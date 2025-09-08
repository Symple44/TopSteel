import { configureStore } from '@reduxjs/toolkit'
import { cartPersistenceMiddleware, loadCartFromStorage } from './cartPersistence'
import cartReducer from './cartSlice'
import { loadWishlistFromStorage, wishlistPersistenceMiddleware } from './wishlistPersistence'
import wishlistReducer from './wishlistSlice'

// Load initial state from localStorage
const preloadedState = {
  cart: {
    items: [],
    isOpen: false,
    lastUpdated: null,
    appliedCoupon: null,
    shippingMethod: null,
    ...loadCartFromStorage(),
  },
  wishlist: {
    items: [],
    lastUpdated: null,
    ...loadWishlistFromStorage(),
  },
}

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['cart/addToCart', 'cart/syncCart', 'wishlist/addToWishlist'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.addedAt',
          'payload?.product?.createdAt',
          'payload?.product?.updatedAt',
        ],
        // Ignore these paths in the state
        ignoredPaths: ['cart.items', 'cart.lastUpdated', 'wishlist.items', 'wishlist.lastUpdated'],
      },
    })
      .concat(cartPersistenceMiddleware)
      .concat(wishlistPersistenceMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
