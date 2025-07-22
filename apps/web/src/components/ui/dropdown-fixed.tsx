'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DropdownFixedProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: 'hover' | 'click'
  className?: string
  contentClassName?: string
}

export function DropdownFixed({ 
  children, 
  content, 
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  trigger = 'click',
  className,
  contentClassName
}: DropdownFixedProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // Utiliser le contrôle externe si fourni, sinon l'interne
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }, [onOpenChange])

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Estimation de la taille du dropdown
    const estimatedDropdownWidth = 200
    const estimatedDropdownHeight = 150

    let x = 0
    let y = 0

    // Calcul de la position selon le side
    switch (side) {
      case 'bottom':
        y = triggerRect.bottom + sideOffset
        break
      case 'top':
        y = triggerRect.top - estimatedDropdownHeight - sideOffset
        break
      case 'right':
        x = triggerRect.right + sideOffset
        break
      case 'left':
        x = triggerRect.left - estimatedDropdownWidth - sideOffset
        break
    }

    // Calcul de l'alignement
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left + alignOffset
          break
        case 'center':
          x = triggerRect.left + (triggerRect.width - estimatedDropdownWidth) / 2 + alignOffset
          break
        case 'end':
          x = triggerRect.right - estimatedDropdownWidth + alignOffset
          break
      }
    } else {
      switch (align) {
        case 'start':
          y = triggerRect.top + alignOffset
          break
        case 'center':
          y = triggerRect.top + (triggerRect.height - estimatedDropdownHeight) / 2 + alignOffset
          break
        case 'end':
          y = triggerRect.bottom - estimatedDropdownHeight + alignOffset
          break
      }
    }

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (x + estimatedDropdownWidth > viewport.width) x = viewport.width - estimatedDropdownWidth - 8
    if (y < 8) y = 8
    if (y + estimatedDropdownHeight > viewport.height) y = viewport.height - estimatedDropdownHeight - 8

    setPosition({ x, y })
  }, [side, align, sideOffset, alignOffset])

  const adjustPosition = React.useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const dropdownRect = dropdownRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = 0
    let y = 0

    // Calcul de la position selon le side avec les vraies dimensions
    switch (side) {
      case 'bottom':
        y = triggerRect.bottom + sideOffset
        break
      case 'top':
        y = triggerRect.top - dropdownRect.height - sideOffset
        break
      case 'right':
        x = triggerRect.right + sideOffset
        break
      case 'left':
        x = triggerRect.left - dropdownRect.width - sideOffset
        break
    }

    // Calcul de l'alignement avec les vraies dimensions
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left + alignOffset
          break
        case 'center':
          x = triggerRect.left + (triggerRect.width - dropdownRect.width) / 2 + alignOffset
          break
        case 'end':
          x = triggerRect.right - dropdownRect.width + alignOffset
          break
      }
    } else {
      switch (align) {
        case 'start':
          y = triggerRect.top + alignOffset
          break
        case 'center':
          y = triggerRect.top + (triggerRect.height - dropdownRect.height) / 2 + alignOffset
          break
        case 'end':
          y = triggerRect.bottom - dropdownRect.height + alignOffset
          break
      }
    }

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (x + dropdownRect.width > viewport.width) x = viewport.width - dropdownRect.width - 8
    if (y < 8) y = 8
    if (y + dropdownRect.height > viewport.height) y = viewport.height - dropdownRect.height - 8

    setPosition({ x, y })
  }, [side, align, sideOffset, alignOffset])

  const showDropdown = React.useCallback(() => {
    if (disabled) return
    handleOpenChange(true)
  }, [disabled, handleOpenChange])

  const hideDropdown = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  const toggleDropdown = React.useCallback(() => {
    if (disabled) return
    handleOpenChange(!isOpen)
  }, [disabled, isOpen, handleOpenChange])

  // Gérer les événements selon le type de trigger
  const triggerProps = React.useMemo(() => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: showDropdown,
        onMouseLeave: hideDropdown
      }
    } else {
      return {
        onClick: toggleDropdown
      }
    }
  }, [trigger, showDropdown, hideDropdown, toggleDropdown])

  // Ajuster la position quand le dropdown devient visible
  React.useEffect(() => {
    if (!isOpen) return

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        hideDropdown()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      clearTimeout(adjustTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, calculatePosition, adjustPosition, hideDropdown])

  const dropdownElement = isOpen && (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-[99999] overflow-hidden rounded-md bg-popover text-popover-foreground shadow-lg border',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        contentClassName
      )}
      style={{
        left: position.x,
        top: position.y,
        opacity: position.x === 0 && position.y === 0 ? 0 : 1,
        transition: 'opacity 150ms ease-in-out, left 100ms ease-out, top 100ms ease-out',
        minWidth: '8rem',
        padding: '1rem'
      }}
      data-state={isOpen ? 'open' : 'closed'}
      onMouseEnter={trigger === 'hover' ? showDropdown : undefined}
      onMouseLeave={trigger === 'hover' ? hideDropdown : undefined}
    >
      {content}
    </div>
  )

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        {...triggerProps}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && dropdownElement && 
        createPortal(dropdownElement, document.body)
      }
    </>
  )
}