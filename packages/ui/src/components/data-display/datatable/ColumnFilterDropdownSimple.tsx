'use client'

import { ArrowDown, ArrowUp, Filter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../primitives/button'

interface ColumnFilterDropdownSimpleProps<T = any> {
  column: {
    id: string
    title: string
  }
  data: T[]
  currentSort?: 'asc' | 'desc' | null
  currentFilters?: string[]
  onSort: (direction: 'asc' | 'desc' | null) => void
  onFilter: (values: string[]) => void
  onAdvancedFilter: () => void
}

export function ColumnFilterDropdownSimple<T = any>({
  column,
  data,
  currentSort,
  currentFilters = [],
  onSort,
  onFilter,
  onAdvancedFilter,
}: ColumnFilterDropdownSimpleProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fermer au clic externe
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Positionner le dropdown
  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return

    const positionDropdown = () => {
      if (!buttonRef.current || !dropdownRef.current) return

      const button = buttonRef.current
      const dropdown = dropdownRef.current
      const rect = button.getBoundingClientRect()
      const dropdownHeight = dropdown.offsetHeight
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom

      // Positionner en dessous ou au-dessus selon l'espace disponible
      if (spaceBelow >= dropdownHeight + 10 || spaceBelow > rect.top) {
        dropdown.style.top = `${rect.bottom + 4}px`
        dropdown.style.bottom = 'auto'
      } else {
        dropdown.style.top = 'auto'
        dropdown.style.bottom = `${viewportHeight - rect.top + 4}px`
      }

      dropdown.style.left = `${rect.left}px`
      dropdown.style.position = 'fixed'
      dropdown.style.zIndex = '50000'
    }

    // Position initiale avec un léger délai pour le rendu
    requestAnimationFrame(() => {
      positionDropdown()
    })

    // Gérer le scroll et le resize
    const handleScrollOrResize = (event?: Event) => {
      // Ne pas fermer si le scroll vient du dropdown lui-même
      if (event?.target && dropdownRef.current) {
        const target = event.target as Element
        if (dropdownRef.current.contains(target)) {
          return
        }
      }

      // Option 1: Repositionner
      // positionDropdown()

      // Option 2: Fermer (plus stable)
      setIsOpen(false)
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen])

  const isFiltered = currentFilters.length > 0
  const hasSort = currentSort !== null

  return (
    <>
      <Button
        type="button"
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-6 w-6 p-0 hover:bg-accent ${isFiltered || hasSort ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Filter className="h-3 w-3" />
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            className="w-64 bg-popover border border-border rounded-md shadow-lg p-3"
            style={{
              position: 'fixed',
              zIndex: 50000,
              pointerEvents: 'auto',
            }}
          >
            <div className="space-y-3">
              <div className="font-medium text-sm">{column.title}</div>

              {/* Boutons de tri */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currentSort === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onSort(currentSort === 'asc' ? null : 'asc')
                    setIsOpen(false)
                  }}
                  className="flex-1"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant={currentSort === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onSort(currentSort === 'desc' ? null : 'desc')
                    setIsOpen(false)
                  }}
                  className="flex-1"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onAdvancedFilter()
                  setIsOpen(false)
                }}
                className="w-full"
              >
                Filtre avancé
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default ColumnFilterDropdownSimple
