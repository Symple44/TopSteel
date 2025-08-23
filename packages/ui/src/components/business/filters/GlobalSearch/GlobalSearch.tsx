'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Users, Building, Package, FileText, Folder, Loader2, ArrowRight } from 'lucide-react'
import { Input } from '../../../primitives/input/Input'
import { Badge } from '../../../data-display/badge'
import { cn } from '../../../../lib/utils'
export type GlobalSearchEntityType = 'client' | 'material' | 'project' | 'invoice' | 'quote' | 'user' | 'supplier'
export interface GlobalSearchResult {
  id: string
  title: string
  subtitle?: string
  description?: string
  type: GlobalSearchEntityType
  status?: string
  url?: string
  metadata?: Record<string, any>
}
interface GlobalSearchProps {
  onSearch?: (query: string) => Promise<GlobalSearchResult[]>
  onSelect?: (result: GlobalSearchResult) => void
  placeholder?: string
  disabled?: boolean
  maxResults?: number
  showEntityTypes?: boolean
  debounceMs?: number
  className?: string
}
const entityIcons = {
  client: Users,
  material: Package,
  project: Folder,
  invoice: FileText,
  quote: FileText,
  user: Users,
  supplier: Building,
}
const entityLabels = {
  client: 'Client',
  material: 'Matériau',
  project: 'Projet',
  invoice: 'Facture',
  quote: 'Devis',
  user: 'Utilisateur',
  supplier: 'Fournisseur',
}
export function GlobalSearch({
  onSearch,
  onSelect,
  placeholder = "Rechercher dans toute l'application...",
  disabled = false,
  maxResults = 20,
  showEntityTypes = true,
  debounceMs = 300,
  className,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
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
  const performSearch = useCallback(async (searchQuery: string) => {
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
    } catch (error) {
      console.error('Global search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [onSearch, maxResults])
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, debounceMs)
  }, [performSearch, debounceMs])
  const handleResultSelect = useCallback((result: GlobalSearchResult) => {
    onSelect?.(result)
    setQuery('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [onSelect])
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleResultSelect(results[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isOpen, results, highlightedIndex, handleResultSelect])
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<GlobalSearchEntityType, GlobalSearchResult[]>)
  return (
    <div className={cn('relative w-full max-w-md', className)} ref={searchRef}>
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
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-96 overflow-auto">
          {showEntityTypes ? (
            Object.entries(groupedResults).map(([entityType, entityResults]) => {
              const IconComponent = entityIcons[entityType as GlobalSearchEntityType]
              return (
                <div key={entityType} className="border-b last:border-b-0">
                  <div className="px-3 py-2 bg-muted/50 border-b">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <IconComponent className="h-3 w-3" />
                      {entityLabels[entityType as GlobalSearchEntityType]} ({entityResults.length})
                    </div>
                  </div>
                  {entityResults.map((result, index) => {
                    const globalIndex = results.findIndex(r => r.id === result.id)
                    const isHighlighted = globalIndex === highlightedIndex
                    return (
                      <div
                        key={result.id}
                        className={cn(
                          'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                          isHighlighted && 'bg-muted',
                          'hover:bg-muted'
                        )}
                        onClick={() => handleResultSelect(result)}
                      >
                        <div className="flex-shrink-0">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                          )}
                          {result.description && (
                            <div className="text-xs text-muted-foreground truncate mt-1">{result.description}</div>
                          )}
                          {result.status && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            results.map((result, index) => {
              const IconComponent = entityIcons[result.type]
              const isHighlighted = index === highlightedIndex
              return (
                <div
                  key={result.id}
                  className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                    isHighlighted && 'bg-muted',
                    'hover:bg-muted'
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {entityLabels[result.type]}
                      </Badge>
                      {result.status && (
                        <Badge variant="outline" className="text-xs">
                          {result.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Aucun résultat trouvé pour "{query}"
        </div>
      )}
    </div>
  )
}
