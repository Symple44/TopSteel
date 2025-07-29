'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  color?: string
}

interface SelectPortalProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
  disabled?: boolean
}

export function SelectPortal({
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  options,
  className,
  disabled = false
}: SelectPortalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = triggerRect.left
    let y = triggerRect.bottom + 4

    // Ajustements pour rester dans le viewport
    if (x < 8) x = 8
    if (y < 8) y = 8

    setPosition({ x, y })
  }, [])

  const adjustPosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = triggerRect.left
    let y = triggerRect.bottom + 4

    // Ajustements pour rester dans le viewport
    if (x + contentRect.width > viewport.width - 8) {
      x = viewport.width - contentRect.width - 8
    }
    if (x < 8) x = 8

    if (y + contentRect.height > viewport.height - 8) {
      // Ouvrir au-dessus si pas de place en dessous
      y = triggerRect.top - contentRect.height - 4
      if (y < 8) {
        y = viewport.height - contentRect.height - 8
      }
    }

    setPosition({ x, y })
  }, [])

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setIsOpen(false)
  }

  const toggleOpen = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

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
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Position calculation effect
  React.useEffect(() => {
    if (!isOpen) return

    calculatePosition()

    const adjustTimer = setTimeout(() => {
      adjustPosition()
    }, 20)

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

  const triggerContent = selectedOption ? (
    <div className="flex items-center gap-2">
      {selectedOption.color && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedOption.color }}
        />
      )}
      <span>{selectedOption.label}</span>
    </div>
  ) : (
    <span className="text-muted-foreground">{placeholder}</span>
  )

  const selectContent = isOpen && typeof document !== 'undefined' && createPortal(
    <div
        ref={contentRef}
        className={cn(
          'fixed z-[99999] min-w-[8rem] overflow-hidden rounded-md border shadow-lg',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border-gray-200 dark:border-gray-700',
          'p-1',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'max-h-[200px] overflow-y-auto'
        )}
        data-select-portal
        style={{
          left: position.x,
          top: position.y,
          width: triggerRef.current?.offsetWidth || 'auto',
          opacity: position.x === 0 && position.y === 0 ? 0 : 1,
          transition: 'opacity 150ms ease-in-out',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb'
        }}
        data-select-portal
      >
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className={cn(
            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700',
            value === option.value && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            {option.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span>{option.label}</span>
          </div>
          {value === option.value && (
            <Check className="h-4 w-4" />
          )}
        </div>
      ))}
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleOpen()
        }}
        disabled={disabled}
        data-select-portal
        className={cn(
          'flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        {triggerContent}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {selectContent}
    </>
  )
}