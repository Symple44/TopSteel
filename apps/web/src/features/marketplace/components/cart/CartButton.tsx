'use client'

import { ShoppingCart } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { cn } from '@/lib/utils'
import { selectCartItemCount, selectCartTotal, setCartOpen } from '../../store/cartSlice'

interface CartButtonProps {
  variant?: 'icon' | 'full' | 'floating'
  className?: string
  showTotal?: boolean
}

export const CartButton: React.FC<CartButtonProps> = ({
  variant = 'icon',
  className,
  showTotal = false,
}) => {
  const dispatch = useDispatch()
  const itemCount = useSelector(selectCartItemCount)
  const total = useSelector(selectCartTotal)
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevCount, setPrevCount] = useState(itemCount)

  useEffect(() => {
    if (itemCount > prevCount) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 500)
    }
    setPrevCount(itemCount)
  }, [itemCount, prevCount])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleClick = () => {
    dispatch(setCartOpen(true))
  }

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'fixed bottom-6 right-6 z-30 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105',
          isAnimating && 'animate-bounce',
          className
        )}
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
      </button>
    )
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
          className
        )}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <span
              className={cn(
                'absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center',
                isAnimating && 'animate-ping'
              )}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-90">My Cart</span>
          {showTotal && itemCount > 0 && (
            <span className="font-semibold">{formatPrice(total)}</span>
          )}
        </div>
      </button>
    )
  }

  // Default icon variant
  return (
    <button
      onClick={handleClick}
      className={cn('relative p-2 hover:bg-gray-100 rounded-lg transition-colors', className)}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <>
          <span
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center',
              isAnimating && 'animate-ping'
            )}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
          {/* Animation ping effect */}
          {isAnimating && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping" />
          )}
        </>
      )}
    </button>
  )
}
