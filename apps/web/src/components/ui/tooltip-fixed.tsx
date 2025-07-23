'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  disabled?: boolean
  delayDuration?: number
}

export function TooltipFixed({ 
  children, 
  content, 
  side = 'right', 
  sideOffset = 10,
  disabled = false,
  delayDuration = 700
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Estimation de la taille du tooltip (sera ajustée après le rendu réel)
    const estimatedTooltipWidth = 250 // largeur estimée
    const estimatedTooltipHeight = 60 // hauteur estimée

    let x = 0
    let y = 0

    switch (side) {
      case 'right':
        x = triggerRect.right + sideOffset
        y = triggerRect.top + (triggerRect.height - estimatedTooltipHeight) / 2
        break
      case 'left':
        x = triggerRect.left - estimatedTooltipWidth - sideOffset
        y = triggerRect.top + (triggerRect.height - estimatedTooltipHeight) / 2
        break
      case 'top':
        x = triggerRect.left + (triggerRect.width - estimatedTooltipWidth) / 2
        y = triggerRect.top - estimatedTooltipHeight - sideOffset
        break
      case 'bottom':
        x = triggerRect.left + (triggerRect.width - estimatedTooltipWidth) / 2
        y = triggerRect.bottom + sideOffset
        break
    }

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (x + estimatedTooltipWidth > viewport.width) x = viewport.width - estimatedTooltipWidth - 8
    if (y < 8) y = 8
    if (y + estimatedTooltipHeight > viewport.height) y = viewport.height - estimatedTooltipHeight - 8

    setPosition({ x, y })
  }, [side, sideOffset])

  const adjustPosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = 0
    let y = 0

    switch (side) {
      case 'right':
        x = triggerRect.right + sideOffset
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - sideOffset
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        break
      case 'top':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        y = triggerRect.top - tooltipRect.height - sideOffset
        break
      case 'bottom':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        y = triggerRect.bottom + sideOffset
        break
    }

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (x + tooltipRect.width > viewport.width) x = viewport.width - tooltipRect.width - 8
    if (y < 8) y = 8
    if (y + tooltipRect.height > viewport.height) y = viewport.height - tooltipRect.height - 8

    setPosition({ x, y })
  }, [side, sideOffset])

  const showTooltip = React.useCallback(() => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Calculer la position immédiatement après que le tooltip devient visible
      requestAnimationFrame(() => {
        calculatePosition()
      })
    }, delayDuration)
  }, [disabled, delayDuration, calculatePosition])

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }, [])

  // Ajuster la position précise après que le tooltip soit visible
  React.useEffect(() => {
    if (!isVisible) return

    // Calculer d'abord la position estimée
    calculatePosition()

    // Puis ajuster avec les vraies dimensions après le rendu
    const adjustTimer = setTimeout(() => {
      adjustPosition()
    }, 20)

    const handleResize = () => {
      calculatePosition()
      setTimeout(() => adjustPosition(), 10)
    }
    const handleScroll = () => {
      calculatePosition()
      setTimeout(() => adjustPosition(), 10)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      clearTimeout(adjustTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isVisible, calculatePosition, adjustPosition])

  // Cleanup timeout
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const tooltipElement = isVisible && (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[99999] overflow-hidden rounded-lg px-3 py-2 text-xs',
        'bg-slate-900/95 dark:bg-slate-800/95 text-white',
        'backdrop-blur-sm border border-slate-700/50 dark:border-slate-600/50',
        'shadow-xl shadow-black/20',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'pointer-events-none select-none max-w-xs'
      )}
      style={{
        left: position.x,
        top: position.y,
        opacity: position.x === 0 && position.y === 0 ? 0 : 1,
        transition: 'opacity 150ms ease-in-out, left 100ms ease-out, top 100ms ease-out'
      }}
    >
      {content}
    </div>
  )

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== 'undefined' && tooltipElement && 
        createPortal(tooltipElement, document.body)
      }
    </>
  )
}