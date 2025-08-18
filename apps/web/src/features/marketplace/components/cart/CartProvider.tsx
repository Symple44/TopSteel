'use client'

import { useSession } from 'next-auth/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  loadCartFromStorage,
  mergeCartsAfterLogin,
  reserveCartStock,
  syncCartWithBackend,
} from '../../store/cartPersistence'
import { addToCart, clearCart, selectCartItems, syncCart } from '../../store/cartSlice'
import { CartButton } from './CartButton'
import { ShoppingCart } from './ShoppingCart'

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
    if (!autoSync || !isInitialized || cartItems.length === 0) return

    const syncTimer = setInterval(() => {
      syncWithBackend()
    }, syncInterval)

    return () => clearInterval(syncTimer)
  }, [autoSync, syncInterval, cartItems, isInitialized, syncWithBackend])

  // Reserve stock when items are added
  useEffect(() => {
    if (cartItems.length > 0 && isInitialized) {
      reserveStock()
    }
  }, [cartItems, isInitialized, reserveStock])

  const initializeCart = async () => {
    try {
      // Generate or retrieve session ID for guest users
      let storedSessionId = localStorage.getItem('marketplace_session_id')
      if (!storedSessionId) {
        storedSessionId = generateSessionId()
        localStorage.setItem('marketplace_session_id', storedSessionId)
      }
      setSessionId(storedSessionId)

      // Load cart from localStorage
      const storedCart = loadCartFromStorage()
      if (storedCart?.items) {
        dispatch(syncCart(storedCart.items))
      }

      // Sync with backend if user is logged in
      if (status === 'authenticated' && session?.user) {
        await syncWithBackend()
      }

      setIsInitialized(true)
    } catch (_error) {
      setIsInitialized(true)
    }
  }

  const handleUserLogin = async () => {
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
        session.user.id
      )

      if (mergedItems.length > 0) {
        dispatch(syncCart(mergedItems))
      }

      // Clear guest session ID
      localStorage.removeItem('marketplace_session_id')
    } catch (_error) {
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUserLogout = () => {
    // Generate new session ID for guest
    const newSessionId = generateSessionId()
    localStorage.setItem('marketplace_session_id', newSessionId)
    setSessionId(newSessionId)
  }

  const syncWithBackend = async () => {
    if (isSyncing || cartItems.length === 0) return

    setIsSyncing(true)
    try {
      const userId = session?.user?.id
      const updatedItems = await syncCartWithBackend(
        {
          items: cartItems,
          isOpen: false,
          lastUpdated: new Date(),
          appliedCoupon: null,
          shippingMethod: null,
        },
        userId,
        userId ? undefined : sessionId
      )

      // Update cart if items have changed
      if (JSON.stringify(updatedItems) !== JSON.stringify(cartItems)) {
        dispatch(syncCart(updatedItems))
      }
    } catch (_error) {
    } finally {
      setIsSyncing(false)
    }
  }

  const reserveStock = async () => {
    try {
      const userId = session?.user?.id
      const reservations = await reserveCartStock(cartItems, userId, userId ? undefined : sessionId)

      // Update cart items with reservation IDs
      reservations.forEach((_reservationId, productId) => {
        const item = cartItems.find((i) => i.product.id === productId)
        if (item && !item.reservationId) {
          // Update reservation ID in Redux
          // Note: You might want to add a specific action for this
        }
      })
    } catch (_error) {}
  }

  const generateSessionId = (): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

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

  const addItemToCart = (product: any, quantity: number = 1, options?: any) => {
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
