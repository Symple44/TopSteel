'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../lib/utils'

interface DropdownPortalProps {
  trigger: React.ReactElement
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onInteractOutside?: (event: Event) => void
}

export function DropdownPortal({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  className,
  open: controlledOpen,
  onOpenChange,
  onInteractOutside,
}: DropdownPortalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    },
    [onOpenChange]
  )

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const _viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    let x = 0
    let y = 0

    // Position de base selon le side
    switch (side) {
      case 'bottom':
        y = triggerRect.bottom + sideOffset
        break
      case 'top':
        y = triggerRect.top - sideOffset
        break
      case 'right':
        x = triggerRect.right + sideOffset
        y = triggerRect.top
        break
      case 'left':
        x = triggerRect.left - sideOffset
        y = triggerRect.top
        break
    }

    // Alignement
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left
          break
        case 'center':
          x = triggerRect.left + triggerRect.width / 2
          break
        case 'end':
          x = triggerRect.right
          break
      }
    }

    // Ajustement pour rester dans le viewport (sera affiné après le rendu)
    if (x < 8) x = 8
    if (y < 8) y = 8

    setPosition({ x, y })
  }, [side, align, sideOffset])

  const adjustPosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    let x = 0
    let y = 0

    // Position de base selon le side avec les vraies dimensions
    switch (side) {
      case 'bottom':
        y = triggerRect.bottom + sideOffset
        break
      case 'top':
        y = triggerRect.top - contentRect.height - sideOffset
        break
      case 'right':
        x = triggerRect.right + sideOffset
        y = triggerRect.top
        break
      case 'left':
        x = triggerRect.left - contentRect.width - sideOffset
        y = triggerRect.top
        break
    }

    // Alignement avec les vraies dimensions
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left
          break
        case 'center':
          x = triggerRect.left + (triggerRect.width - contentRect.width) / 2
          break
        case 'end':
          x = triggerRect.right - contentRect.width
          break
      }
    } else {
      // Pour left/right, centrer verticalement par défaut
      y = triggerRect.top + (triggerRect.height - contentRect.height) / 2
    }

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (x + contentRect.width > viewport.width - 8) {
      x = viewport.width - contentRect.width - 8
    }
    if (y < 8) y = 8
    if (y + contentRect.height > viewport.height - 8) {
      // Si on déborde en bas, essayer de positionner au-dessus
      if (side === 'bottom') {
        y = triggerRect.top - contentRect.height - sideOffset
        if (y < 8) {
          y = viewport.height - contentRect.height - 8
        }
      } else {
        y = viewport.height - contentRect.height - 8
      }
    }

    setPosition({ x, y })
  }, [side, align, sideOffset])

  // Toggle dropdown
  const toggleDropdown = React.useCallback(() => {
    handleOpenChange(!isOpen)
  }, [isOpen, handleOpenChange])

  // Close dropdown
  const closeDropdown = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  // Click outside handler
  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        // Appeler onInteractOutside si fourni, sinon fermer directement
        if (onInteractOutside) {
          onInteractOutside(event)
        } else {
          closeDropdown()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeDropdown, onInteractOutside])

  // Position calculation effect
  React.useEffect(() => {
    if (!isOpen) return

    // Position initiale
    calculatePosition()

    // Ajustement avec les vraies dimensions
    const adjustTimer = setTimeout(() => {
      adjustPosition()
    }, 20)

    // Event listeners pour recalculer la position
    const handleResize = () => {
      calculatePosition()
      setTimeout(adjustPosition, 10)
    }

    const handleScroll = () => {
      calculatePosition()
      setTimeout(adjustPosition, 10)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      clearTimeout(adjustTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, calculatePosition, adjustPosition])

  // Clone du trigger avec les event handlers
  const triggerElement = React.cloneElement(trigger, {
    ref: (node: HTMLElement) => {
      if (node) {
        triggerRef.current = node
      }
      // Forward ref si le trigger en a une
      const originalRef = (trigger as any).ref || (trigger.props as any)?.ref
      if (typeof originalRef === 'function') {
        originalRef(node)
      } else if (originalRef && 'current' in originalRef) {
        originalRef.current = node
      }
    },
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.nativeEvent.stopImmediatePropagation()
      toggleDropdown()
      // Appeler l'onClick original si présent
      if (trigger.props && typeof (trigger.props as any).onClick === 'function') {
        ;(trigger.props as any).onClick(e)
      }
    },
  } as any)

  // Portal pour le contenu du dropdown
  const dropdownContent =
    isOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={contentRef}
        className={cn(
          'fixed z-[99999] min-w-[8rem] overflow-hidden rounded-md border shadow-lg',
          'bg-popover text-popover-foreground',
          'border-border',
          'p-1',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        data-dropdown-portal
        style={{
          left: position.x,
          top: position.y,
          opacity: position.x === 0 && position.y === 0 ? 0 : 1,
          transition: 'opacity 150ms ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Context provider pour que les enfants puissent fermer le dropdown */}
        <DropdownContext.Provider value={{ closeDropdown }}>{children}</DropdownContext.Provider>
      </div>,
      document.body
    )

  return (
    <>
      {triggerElement}
      {dropdownContent}
    </>
  )
}

// Context pour que les items puissent fermer le dropdown
const DropdownContext = React.createContext<{ closeDropdown: () => void } | null>(null)

export const useDropdownContext = () => {
  const context = React.useContext(DropdownContext)
  return context
}

// Composant pour les items qui ferment automatiquement le dropdown
interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function DropdownItem({
  children,
  onClick,
  className,
  disabled = false,
}: DropdownItemProps) {
  const context = useDropdownContext()

  const handleClick = () => {
    if (!disabled) {
      onClick?.()
      context?.closeDropdown()
    }
  }

  return (
    <button
      onClick={handleClick}
      data-dropdown-item
      type="button"
      disabled={disabled}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full text-left',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} />
}
