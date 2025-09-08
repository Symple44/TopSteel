'use client'
import { Building, Loader2, Mail, MapPin, Phone, Search, Users, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
export interface ClientSearchResult {
  id: string
  name: string
  type: 'individual' | 'company'
  email?: string
  phone?: string
  city?: string
  country?: string
  avatar?: string
  status: 'active' | 'inactive' | 'pending' | 'blocked'
  totalOrders?: number
  lastOrderDate?: string
  tags?: string[]
}
interface ClientSearchProps {
  value?: ClientSearchResult | null
  onSelect?: (client: ClientSearchResult | null) => void
  onSearch?: (query: string) => Promise<ClientSearchResult[]>
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  maxResults?: number
  showDetails?: boolean
  clearable?: true
  autoFocus?: boolean
  className?: string
}
export function ClientSearch({
  value,
  onSelect,
  onSearch,
  placeholder = 'Rechercher un client...',
  disabled = false,
  multiple = false,
  maxResults = 10,
  showDetails = true,
  clearable = true,
  autoFocus = false,
  className,
}: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedClients, setSelectedClients] = useState<ClientSearchResult[]>(
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
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value)
      }, 300)
    },
    [performSearch]
  )
  const handleClientSelect = useCallback(
    (client: ClientSearchResult) => {
      if (multiple) {
        const isAlreadySelected = selectedClients.some((c) => c.id === client.id)
        let newSelection: ClientSearchResult[]
        if (isAlreadySelected) {
          newSelection = selectedClients.filter((c) => c.id !== client.id)
        } else {
          newSelection = [...selectedClients, client]
        }
        setSelectedClients(newSelection)
        onSelect?.(newSelection.length > 0 ? (newSelection as unknown) : null)
      } else {
        setSelectedClients([client])
        onSelect?.(client)
        setQuery('')
        setIsOpen(false)
      }
      setHighlightedIndex(-1)
    },
    [multiple, selectedClients, onSelect]
  )
  const handleRemoveClient = useCallback(
    (clientId: string) => {
      const newSelection = selectedClients.filter((c) => c.id !== clientId)
      setSelectedClients(newSelection)
      onSelect?.(newSelection.length > 0 ? (newSelection as unknown) : null)
    },
    [selectedClients, onSelect]
  )
  const clearSelection = useCallback(() => {
    setSelectedClients([])
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
            handleClientSelect(results[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, results, highlightedIndex, handleClientSelect]
  )
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      blocked: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || colors.inactive
  }
  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
      blocked: 'Bloqué',
    }
    return labels[status as keyof typeof labels] || status
  }
  return (
    <div className={cn('relative', className)} ref={searchRef}>
      {/* Selected Clients (Multiple Mode) */}
      {multiple && selectedClients.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedClients.map((client) => (
            <Badge
              key={client.id}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1"
            >
              {client.type === 'company' ? (
                <Building className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              <span className="text-sm">{client.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveClient(client.id)}
                className="h-3 w-3 p-0 border-0 bg-transparent hover:text-destructive focus:outline-none focus:text-destructive"
                aria-label={`Supprimer ${client.name}`}
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
        {/* Loading Spinner */}
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {/* Clear Button */}
        {clearable && (query || selectedClients.length > 0) && (
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
          {results.map((client, index) => {
            const isHighlighted = index === highlightedIndex
            const isSelected = selectedClients.some((c) => c.id === client.id)
            return (
              // biome-ignore lint/a11y/useSemanticElements: This div uses role="button" with complex nested content including badges, icons, and text. Using a button element would interfere with layout and styling.
              <div
                key={client.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                  isHighlighted && 'bg-muted',
                  isSelected && 'bg-primary/10',
                  'hover:bg-muted'
                )}
                onClick={() => handleClientSelect(client)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClientSelect(client)
                  }
                }}
              >
                {/* Client Icon */}
                <div className="flex-shrink-0">
                  {client.type === 'company' ? (
                    <Building className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Users className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{client.name}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getStatusColor(client.status))}
                    >
                      {getStatusLabel(client.status)}
                    </Badge>
                  </div>
                  {showDetails && (
                    <div className="mt-1 space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {(client.city || client.country) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{[client.city, client.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Tags */}
                  {client.tags && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {client.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {/* Order Info */}
                {showDetails && client.totalOrders !== undefined && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-medium">{client.totalOrders} commandes</div>
                    {client.lastOrderDate && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(client.lastOrderDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                )}
                {/* Selected Indicator */}
                {isSelected && multiple && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Aucun client trouvé pour "{query}"
        </div>
      )}
    </div>
  )
}
