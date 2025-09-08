import type { Middleware } from '@reduxjs/toolkit'
import type { WishlistItem, WishlistState } from './wishlistSlice'

const WISHLIST_STORAGE_KEY = 'topsteel_marketplace_wishlist'
const WISHLIST_EXPIRY_DAYS = 90

export interface PersistedWishlist {
  items: WishlistItem[]
  lastUpdated: string
  expiresAt: string
}

/**
 * Load wishlist from localStorage
 */
export const loadWishlistFromStorage = (): Partial<WishlistState> | null => {
  try {
    if (typeof window === 'undefined') return null

    const stored = localStorage?.getItem(WISHLIST_STORAGE_KEY)
    if (!stored) return null

    const persisted: PersistedWishlist = JSON.parse(stored)

    // Check if wishlist has expired
    const expiresAt = new Date(persisted.expiresAt)
    if (expiresAt < new Date()) {
      localStorage?.removeItem(WISHLIST_STORAGE_KEY)
      return null
    }

    // Convert date strings back to Date objects
    const items = persisted?.items?.map((item) => ({
      ...item,
      addedAt: new Date(item.addedAt),
    }))

    return {
      items,
      lastUpdated: persisted.lastUpdated ? new Date(persisted.lastUpdated) : null,
    }
  } catch (_error) {
    return null
  }
}

/**
 * Save wishlist to localStorage
 */
export const saveWishlistToStorage = (wishlist: WishlistState): void => {
  try {
    if (typeof window === 'undefined') return

    const expiresAt = new Date()
    expiresAt?.setDate(expiresAt?.getDate() + WISHLIST_EXPIRY_DAYS)

    const persisted: PersistedWishlist = {
      items: wishlist.items,
      lastUpdated: wishlist.lastUpdated?.toISOString() || new Date().toISOString(),
      expiresAt: expiresAt?.toISOString(),
    }

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(persisted))
  } catch (_error) {}
}

/**
 * Clear wishlist from localStorage
 */
export const clearWishlistFromStorage = (): void => {
  try {
    if (typeof window === 'undefined') return
    localStorage?.removeItem(WISHLIST_STORAGE_KEY)
  } catch (_error) {}
}

/**
 * Redux middleware for wishlist persistence
 */
export const wishlistPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  // List of actions that should trigger wishlist save
  const persistActions = [
    'wishlist/addToWishlist',
    'wishlist/removeFromWishlist',
    'wishlist/updateWishlistItem',
    'wishlist/clearWishlist',
    'wishlist/moveToCart',
    'wishlist/syncWishlist',
    'wishlist/sortWishlist',
  ]

  if (persistActions?.includes((action as unknown).type)) {
    const state = store?.getState()
    if (state?.wishlist) {
      saveWishlistToStorage(state?.wishlist)
    }
  }

  // Clear storage when wishlist is cleared
  if ((action as unknown).type === 'wishlist/clearWishlist') {
    clearWishlistFromStorage()
  }

  return result
}

/**
 * Sync wishlist with backend API
 */
export const syncWishlistWithBackend = async (
  wishlist: WishlistState,
  userId?: string
): Promise<WishlistItem[]> => {
  try {
    const response = await fetch('/api/marketplace/wishlist/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        items: wishlist?.items?.map((item) => ({
          productId: item?.product?.id,
          notes: item.notes,
          priority: item.priority,
          addedAt: item.addedAt,
        })),
      }),
    })

    if (!response?.ok) {
      throw new Error('Failed to sync wishlist with backend')
    }

    const data = await response?.json()

    // Update items with latest product data
    return data?.items?.map((item: unknown) => ({
      product: item.product,
      addedAt: new Date(item.addedAt),
      notes: item.notes,
      priority: item.priority,
    }))
  } catch (_error) {
    return wishlist.items
  }
}

/**
 * Share wishlist via email or link
 */
export const shareWishlist = async (
  wishlist: WishlistState,
  method: 'email' | 'link',
  recipient?: string
): Promise<{ success: boolean; shareUrl?: string }> => {
  try {
    const response = await fetch('/api/marketplace/wishlist/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: wishlist?.items?.map((item) => item?.product?.id),
        method,
        recipient,
      }),
    })

    if (!response?.ok) {
      throw new Error('Failed to share wishlist')
    }

    const data = await response?.json()

    return {
      success: true,
      shareUrl: data.shareUrl,
    }
  } catch (_error) {
    return { success: false }
  }
}
