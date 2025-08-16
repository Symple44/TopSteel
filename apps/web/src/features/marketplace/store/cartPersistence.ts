import { Middleware } from '@reduxjs/toolkit';
import { CartState, CartItem } from './cartSlice';

const CART_STORAGE_KEY = 'topsteel_marketplace_cart';
const CART_EXPIRY_DAYS = 30;

export interface PersistedCart {
  items: CartItem[];
  appliedCoupon: CartState['appliedCoupon'];
  shippingMethod: CartState['shippingMethod'];
  lastUpdated: string;
  expiresAt: string;
}

/**
 * Load cart from localStorage
 */
export const loadCartFromStorage = (): Partial<CartState> | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return null;
    
    const persisted: PersistedCart = JSON.parse(stored);
    
    // Check if cart has expired
    const expiresAt = new Date(persisted.expiresAt);
    if (expiresAt < new Date()) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }
    
    // Convert date strings back to Date objects
    const items = persisted.items.map(item => ({
      ...item,
      addedAt: new Date(item.addedAt)
    }));
    
    return {
      items,
      appliedCoupon: persisted.appliedCoupon,
      shippingMethod: persisted.shippingMethod,
      lastUpdated: persisted.lastUpdated ? new Date(persisted.lastUpdated) : null,
      isOpen: false
    };
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return null;
  }
};

/**
 * Save cart to localStorage
 */
export const saveCartToStorage = (cart: CartState): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CART_EXPIRY_DAYS);
    
    const persisted: PersistedCart = {
      items: cart.items,
      appliedCoupon: cart.appliedCoupon,
      shippingMethod: cart.shippingMethod,
      lastUpdated: cart.lastUpdated?.toISOString() || new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persisted));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

/**
 * Clear cart from localStorage
 */
export const clearCartFromStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart from storage:', error);
  }
};

/**
 * Redux middleware for cart persistence
 */
export const cartPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // List of actions that should trigger cart save
  const persistActions = [
    'cart/addToCart',
    'cart/updateQuantity',
    'cart/removeFromCart',
    'cart/clearCart',
    'cart/applyCoupon',
    'cart/removeCoupon',
    'cart/setShippingMethod',
    'cart/syncCart'
  ];
  
  if (persistActions.includes(action.type)) {
    const state = store.getState();
    if (state.cart) {
      saveCartToStorage(state.cart);
    }
  }
  
  // Clear storage when cart is cleared
  if (action.type === 'cart/clearCart') {
    clearCartFromStorage();
  }
  
  return result;
};

/**
 * Sync cart with backend API
 */
export const syncCartWithBackend = async (
  cart: CartState,
  userId?: string,
  sessionId?: string
): Promise<CartItem[]> => {
  try {
    const response = await fetch('/api/marketplace/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        sessionId,
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          options: item.selectedOptions
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync cart with backend');
    }
    
    const data = await response.json();
    
    // Update items with latest product data and stock availability
    return data.items.map((item: any) => ({
      product: item.product,
      quantity: item.availableQuantity || item.quantity,
      selectedOptions: item.options,
      addedAt: new Date(item.addedAt),
      reservationId: item.reservationId
    }));
  } catch (error) {
    console.error('Error syncing cart with backend:', error);
    return cart.items;
  }
};

/**
 * Merge guest cart with user cart after login
 */
export const mergeCartsAfterLogin = async (
  guestCart: CartState,
  userId: string
): Promise<CartItem[]> => {
  try {
    const response = await fetch('/api/marketplace/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        guestItems: guestCart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          options: item.selectedOptions
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to merge carts');
    }
    
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      product: item.product,
      quantity: item.quantity,
      selectedOptions: item.options,
      addedAt: new Date(item.addedAt),
      reservationId: item.reservationId
    }));
  } catch (error) {
    console.error('Error merging carts:', error);
    return guestCart.items;
  }
};

/**
 * Reserve stock for cart items
 */
export const reserveCartStock = async (
  items: CartItem[],
  userId?: string,
  sessionId?: string
): Promise<Map<string, string>> => {
  const reservations = new Map<string, string>();
  
  try {
    const response = await fetch('/api/marketplace/cart/reserve-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        sessionId,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reserve stock');
    }
    
    const data = await response.json();
    
    data.reservations.forEach((reservation: any) => {
      reservations.set(reservation.productId, reservation.reservationId);
    });
    
    return reservations;
  } catch (error) {
    console.error('Error reserving stock:', error);
    return reservations;
  }
};

/**
 * Validate cart items (check stock, prices, etc.)
 */
export const validateCart = async (cart: CartState): Promise<{
  valid: boolean;
  issues: Array<{
    productId: string;
    type: 'OUT_OF_STOCK' | 'PRICE_CHANGED' | 'DISCONTINUED';
    message: string;
    currentPrice?: number;
    availableQuantity?: number;
  }>;
  updatedItems: CartItem[];
}> => {
  try {
    const response = await fetch('/api/marketplace/cart/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate cart');
    }
    
    const data = await response.json();
    
    return {
      valid: data.valid,
      issues: data.issues || [],
      updatedItems: data.updatedItems || cart.items
    };
  } catch (error) {
    console.error('Error validating cart:', error);
    return {
      valid: true,
      issues: [],
      updatedItems: cart.items
    };
  }
};