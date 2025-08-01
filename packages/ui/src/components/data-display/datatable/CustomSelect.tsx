'use client'

import { Button } from '../../primitives/button'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
  disabled?: boolean
  translations?: {
    noOptions?: string
  }
}

export function CustomSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className = '',
  disabled = false,
  translations,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const defaultPlaceholder = placeholder || 'Select...'

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const container = containerRef.current
      const dropdown = dropdownRef.current
      const containerRect = container.getBoundingClientRect()
      const dropdownHeight = dropdown.offsetHeight
      const viewportHeight = window.innerHeight

      // Calculer la position optimale
      const spaceBelow = viewportHeight - containerRect.bottom
      const spaceAbove = containerRect.top

      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Afficher en dessous
        dropdown.style.top = '100%'
        dropdown.style.bottom = 'auto'
        dropdown.style.maxHeight = `${Math.min(300, spaceBelow - 10)}px`
      } else {
        // Afficher au dessus
        dropdown.style.top = 'auto'
        dropdown.style.bottom = '100%'
        dropdown.style.maxHeight = `${Math.min(300, spaceAbove - 10)}px`
      }
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <Button
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between text-left font-normal"
        type="button"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : defaultPlaceholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-[10002] bg-background border border-border rounded-md shadow-lg overflow-hidden"
          style={{ minWidth: '100%' }}
        >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="flex items-center w-full px-3 py-2 text-sm text-left text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelect(option.value)}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 ml-2 text-primary" />}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">{translations?.noOptions || 'No options available'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomSelect
