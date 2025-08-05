'use client'

import { ArrowDown, ArrowUp, Check, Filter, Search, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../../primitives/button'
import { DropdownPortal } from './DropdownPortal'

interface ColumnFilterDropdownProps<T = any> {
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
  translations?: {
    search?: string
    clear?: string
    selectAll?: string
    noValues?: string
  }
}

export function ColumnFilterDropdown<T = any>({
  column,
  data,
  currentSort,
  currentFilters = [],
  onSort,
  onFilter,
  onAdvancedFilter,
  translations,
}: ColumnFilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedValues, setSelectedValues] = useState<string[]>(currentFilters)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Extraire les valeurs uniques de la colonne
  const uniqueValues = React.useMemo(() => {
    const values = new Set<string>()
    data.forEach((item) => {
      const value = (item as any)[column.id]
      if (value !== null && value !== undefined) {
        values.add(String(value))
      }
    })
    return Array.from(values).sort()
  }, [data, column.id])

  // Filtrer les valeurs par terme de recherche
  const filteredValues = uniqueValues.filter((value) =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleScroll(event: Event) {
      if (isOpen) {
        // Ne pas fermer si le scroll vient du dropdown lui-même
        if (event.target && containerRef.current) {
          const target = event.target as Element
          if (containerRef.current.contains(target)) {
            return
          }
        }
        setIsOpen(false)
      }
    }

    function handleResize() {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true) // true for capturing phase
      window.addEventListener('resize', handleResize)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const container = containerRef.current
      const dropdown = dropdownRef.current
      const containerRect = container.getBoundingClientRect()
      const dropdownHeight = 400
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      const spaceBelow = viewportHeight - containerRect.bottom
      const spaceAbove = containerRect.top
      const spaceRight = viewportWidth - containerRect.left

      // Positionnement fixe pour survoler le tableau
      dropdown.style.position = 'fixed'
      dropdown.style.left = `${containerRect.left}px`
      dropdown.style.minWidth = '300px'
      dropdown.style.maxWidth = `${Math.min(400, spaceRight - 20)}px`

      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        dropdown.style.top = `${containerRect.bottom + 2}px`
        dropdown.style.bottom = 'auto'
        dropdown.style.maxHeight = `${Math.min(400, spaceBelow - 10)}px`
      } else {
        dropdown.style.top = 'auto'
        dropdown.style.bottom = `${viewportHeight - containerRect.top + 2}px`
        dropdown.style.maxHeight = `${Math.min(400, spaceAbove - 10)}px`
      }
    }
  }, [isOpen])

  const handleSort = (direction: 'asc' | 'desc' | null) => {
    onSort(direction)
    setIsOpen(false)
  }

  const handleValueToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]

    setSelectedValues(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedValues.length === filteredValues.length) {
      setSelectedValues([])
    } else {
      setSelectedValues(filteredValues)
    }
  }

  const handleApplyFilter = () => {
    onFilter(selectedValues)
    setIsOpen(false)
  }

  const handleClearFilter = () => {
    setSelectedValues([])
    onFilter([])
    setIsOpen(false)
  }

  const isFiltered = currentFilters.length > 0
  const hasSort = currentSort !== null

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-6 w-6 p-0 hover:bg-accent ${isFiltered || hasSort ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Filter className="h-3 w-3" />
      </Button>

      {isOpen && (
        <DropdownPortal>
          <div
            ref={dropdownRef}
            className="column-filter-dropdown w-80 bg-popover border border-border rounded-md overflow-hidden"
            style={{
              minWidth: '300px',
              pointerEvents: 'auto',
            }}
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="font-medium text-sm mb-2">{column.title}</div>

              <div className="flex gap-1 mb-2">
                <Button
                  variant={currentSort === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort(currentSort === 'asc' ? null : 'asc')}
                  className="flex-1"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Ascending
                </Button>
                <Button
                  variant={currentSort === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort(currentSort === 'desc' ? null : 'desc')}
                  className="flex-1"
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Descending
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={onAdvancedFilter} className="w-full">
                <Search className="h-3 w-3 mr-1" />
                Advanced Filter
              </Button>
            </div>

            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={translations?.search || 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="p-2 border-b border-border bg-muted/20">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
                  {selectedValues.length === filteredValues.length
                    ? translations?.clear || 'Clear'
                    : translations?.selectAll || 'Select All'}
                </Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {selectedValues.length} / {filteredValues.length}
                </span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredValues.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {translations?.noValues || 'No values found'}
                </div>
              ) : (
                filteredValues.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleValueToggle(value)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center w-4 h-4 mr-2 border border-border rounded">
                      {selectedValues.includes(value) && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <span className="flex-1 truncate">{value}</span>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-border bg-muted/20 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilter} className="flex-1">
                <X className="h-3 w-3 mr-1" />
                {translations?.clear || 'Clear'}
              </Button>
              <Button variant="default" size="sm" onClick={handleApplyFilter} className="flex-1">
                <Check className="h-3 w-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}

export default ColumnFilterDropdown
