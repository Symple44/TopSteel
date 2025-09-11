'use client'

// import { useSession } from 'next-auth/react' // Disabled - next-auth not installed

interface User {
  id: string
  email: string
  name?: string
}

interface SessionData {
  user: User
}

const useSession = () => ({ 
  data: null as SessionData | null, 
  status: 'unauthenticated' as 'authenticated' | 'unauthenticated' | 'loading' 
})

import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Product } from '../products/ProductCard'
import {
  loadCartFromStorage,
  mergeCartsAfterLogin,
  reserveCartStock,
  syncCartWithBackend,
} from '../../store/cartPersistence'
import { addToCart, clearCart, selectCartItems, syncCart } from '../../store/cartSlice'
import { CartButton } from './CartButton'
import { ShoppingCart } from './ShoppingCart'

type CartOptions = Record<string, string | number | boolean>

interface CartProviderProps {
  children: React.ReactNode
  showFloatingButton?: boolean
  autoSync?: boolean
  syncInterval?: number // in milliseconds
}

export const CartProvider: React.FC<CartProviderProps> = ({
  children,
  showFloatingButton = true,
  autoSync = true,
  syncInterval = 60000, // 1 minute
}) => {
  const dispatch = useDispatch()
  const { data: session, status } = useSession()
  const cartItems = useSelector(selectCartItems)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  // Helper functions defined with useCallback to avoid hoisting issues
  const generateSessionId = useCallback((): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }, [])

  const syncWithBackend = useCallback(async () => {
    if (!sessionId || status !== 'authenticated' || !session?.user?.id) return

    try {
      await syncCartWithBackend(
        {
          items: cartItems,
          isOpen: false,
          lastUpdated: new Date(),
          appliedCoupon: null,
          shippingMethod: null,
        },
        session?.user?.id
      )
    } catch (_error) {}
  }, [sessionId, status, session?.user?.id, cartItems])

  const reserveStock = useCallback(async () => {
    if (cartItems?.length === 0) return

    try {
      await reserveCartStock(cartItems, sessionId)
    } catch (_error) {}
  }, [cartItems, sessionId])

  const initializeCart = useCallback(async () => {
    try {
      // Generate or retrieve session ID for guest users
      let storedSessionId = localStorage?.getItem('marketplace_session_id')
      if (!storedSessionId) {
        storedSessionId = generateSessionId()
        localStorage.setItem('marketplace_session_id', storedSessionId)
      }
      setSessionId(storedSessionId)

      // Load cart from localStorage
      const storedCart = loadCartFromStorage()
      if (storedCart?.items) {
        dispatch(syncCart(storedCart?.items))
      }

      // Sync with backend if user is logged in
      if (status === 'authenticated' && session?.user) {
        await syncWithBackend()
      }

      setIsInitialized(true)
    } catch (_error) {
      setIsInitialized(true)
    }
  }, [dispatch, status, session?.user, generateSessionId, syncWithBackend])

  const handleUserLogin = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return

    setIsSyncing(true)
    try {
      // Merge guest cart with user cart
      const mergedItems = await mergeCartsAfterLogin(
        {
          items: cartItems,
          isOpen: false,
          lastUpdated: new Date(),
          appliedCoupon: null,
          shippingMethod: null,
        },
        session?.user?.id
      )

      if (mergedItems?.length > 0) {
        dispatch(syncCart(mergedItems))
      }

      await syncWithBackend()
    } catch (_error) {
    } finally {
      setIsSyncing(false)
    }
  }, [session?.user?.id, isSyncing, cartItems, dispatch, syncWithBackend])

  const handleUserLogout = useCallback(() => {
    // Clear user-specific data but keep guest cart
    setIsSyncing(false)
    // Don't clear the cart items, just reset sync status
  }, [])

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeCart()
    }
  }, [isInitialized, initializeCart])

  // Handle user login/logout
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !isSyncing) {
      handleUserLogin()
    } else if (status === 'unauthenticated' && isInitialized) {
      handleUserLogout()
    }
  }, [status, session, isInitialized, handleUserLogin, handleUserLogout, isSyncing])

  // Auto-sync with backend
  useEffect(() => {
    if (!autoSync || !isInitialized || cartItems?.length === 0) return undefined

    const syncTimer = setInterval(() => {
      syncWithBackend()
    }, syncInterval)

    return () => clearInterval(syncTimer)
  }, [autoSync, syncInterval, cartItems, isInitialized, syncWithBackend])

  // Reserve stock when items are added
  useEffect(() => {
    if (cartItems?.length > 0 && isInitialized) {
      reserveStock()
    }
  }, [cartItems, isInitialized, reserveStock])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {children}
      <ShoppingCart />
      {showFloatingButton && <CartButton variant="floating" />}
    </>
  )
}

// Hook to use cart functionality
export const useCart = () => {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)

  const addItemToCart = (product: Product, quantity: number = 1, options?: CartOptions) => {
    dispatch(addToCart({ product, quantity, options }))
  }

  const clearAllItems = () => {
    dispatch(clearCart())
  }

  return {
    items: cartItems,
    addToCart: addItemToCart,
    clearCart: clearAllItems,
  }
}
