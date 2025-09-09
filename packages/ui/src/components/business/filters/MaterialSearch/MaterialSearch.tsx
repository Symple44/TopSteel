'use client'
import { Loader2, Package, Scale, Search, Wrench, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
export interface MaterialSearchResult {
  id: string
  name: string
  code: string
  category?: string
  grade?: string
  dimensions?: string
  weight?: number
  unit?: string
  price?: number
  currency?: string
  stock?: number
  supplier?: string
  description?: string
  properties?: Record<string, unknown>
}
interface MaterialSearchProps {
  value?: MaterialSearchResult | null
  onSelect?: (material: MaterialSearchResult | null) => void
  onSearch?: (query: string) => Promise<MaterialSearchResult[]>
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  maxResults?: number
  showDetails?: boolean
  clearable?: boolean
  autoFocus?: boolean
  className?: string
}
export function MaterialSearch({
  value,
  onSelect,
  onSearch,
  placeholder = 'Rechercher un matériau...',
  disabled = false,
  multiple = false,
  maxResults = 10,
  showDetails = true,
  clearable = true,
  autoFocus = false,
  className,
}: MaterialSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MaterialSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSearchResult[]>(
    multiple && Array.isArray(value) ? value : value ? [value] : []
  )
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!onSearch || searchQuery.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }
      setIsLoading(true)
      try {
        const searchResults = await onSearch(searchQuery.trim())
        setResults(searchResults.slice(0, maxResults))
        setIsOpen(true)
        setHighlightedIndex(-1)
      } catch (_error) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [onSearch, maxResults]
  )
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value)
      }, 300)
    },
    [performSearch]
  )
  const handleMaterialSelect = useCallback(
    (material: MaterialSearchResult) => {
      if (multiple) {
        const isAlreadySelected = selectedMaterials.some((m) => m.id === material.id)
        let newSelection: MaterialSearchResult[]
        if (isAlreadySelected) {
          newSelection = selectedMaterials.filter((m) => m.id !== material.id)
        } else {
          newSelection = [...selectedMaterials, material]
        }
        setSelectedMaterials(newSelection)
        onSelect?.(newSelection.length > 0 ? (newSelection as any) : null)
      } else {
        setSelectedMaterials([material])
        onSelect?.(material)
        setQuery('')
        setIsOpen(false)
      }
      setHighlightedIndex(-1)
    },
    [multiple, selectedMaterials, onSelect]
  )
  const handleRemoveMaterial = useCallback(
    (materialId: string) => {
      const newSelection = selectedMaterials.filter((m) => m.id !== materialId)
      setSelectedMaterials(newSelection)
      onSelect?.(newSelection.length > 0 ? (newSelection as any) : null)
    },
    [selectedMaterials, onSelect]
  )
  const clearSelection = useCallback(() => {
    setSelectedMaterials([])
    setQuery('')
    onSelect?.(null)
    setIsOpen(false)
  }, [onSelect])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleMaterialSelect(results[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, results, highlightedIndex, handleMaterialSelect]
  )
  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }
  const formatWeight = (weight: number, unit: string = 'kg') => {
    return `${weight.toLocaleString('fr-FR')} ${unit}`
  }
  return (
    <div className={cn('relative', className)} ref={searchRef}>
      {/* Selected Materials (Multiple Mode) */}
      {multiple && selectedMaterials.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedMaterials.map((material) => (
            <Badge
              key={material.id}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1"
            >
              <Package className="h-3 w-3" />
              <span className="text-sm">{material.name}</span>
              <span className="text-xs text-muted-foreground">({material.code})</span>
              <button
                type="button"
                className="h-3 w-3 cursor-pointer hover:text-destructive p-0 border-0 bg-transparent"
                onClick={() => handleRemoveMaterial(material.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRemoveMaterial(material.id)
                  }
                }}
                aria-label={`Supprimer ${material.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {clearable && (query || selectedMaterials.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-auto">
          {results.map((material, index) => {
            const isHighlighted = index === highlightedIndex
            const isSelected = selectedMaterials.some((m) => m.id === material.id)
            return (
              <button
                key={material.id}
                type="button"
                className={cn(
                  'flex items-start gap-3 p-3 cursor-pointer transition-colors w-full text-left',
                  isHighlighted && 'bg-muted',
                  isSelected && 'bg-primary/10',
                  'hover:bg-muted'
                )}
                onClick={() => handleMaterialSelect(material)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleMaterialSelect(material)
                  }
                }}
              >
                <div className="flex-shrink-0 mt-1">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{material.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {material.code}
                    </Badge>
                  </div>
                  {showDetails && (
                    <div className="space-y-1">
                      {material.category && (
                        <div className="text-xs text-muted-foreground">
                          Catégorie: {material.category}
                          {material.grade && ` • Grade: ${material.grade}`}
                        </div>
                      )}
                      {material.dimensions && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Wrench className="h-3 w-3" />
                          <span>{material.dimensions}</span>
                        </div>
                      )}
                      {material.weight && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Scale className="h-3 w-3" />
                          <span>{formatWeight(material.weight, material.unit)}</span>
                        </div>
                      )}
                      {material.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {material.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Price & Stock Info */}
                {showDetails && (
                  <div className="flex-shrink-0 text-right">
                    {material.price && (
                      <div className="text-sm font-medium">
                        {formatPrice(material.price, material.currency)}
                      </div>
                    )}
                    {material.stock !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Stock: {material.stock.toLocaleString('fr-FR')}
                      </div>
                    )}
                    {material.supplier && (
                      <div className="text-xs text-muted-foreground">{material.supplier}</div>
                    )}
                  </div>
                )}
                {/* Selected Indicator */}
                {isSelected && multiple && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Aucun matériau trouvé pour "{query}"
        </div>
      )}
    </div>
  )
}
