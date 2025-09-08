'use client'

import { debounce } from 'lodash'
import {
  ArrowRight,
  Clock,
  Filter,
  Loader2,
  Package,
  Search,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  type: 'product' | 'category' | 'brand' | 'recent' | 'trending'
  id: string
  title: string
  subtitle?: string
  count?: number
  image?: string
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  autoFocus?: boolean
}

const mockSuggestions: SearchSuggestion[] = [
  {
    type: 'trending',
    id: '1',
    title: 'Steel Beams',
    subtitle: '243 products',
    count: 243,
  },
  {
    type: 'trending',
    id: '2',
    title: 'Welding Equipment',
    subtitle: '156 products',
    count: 156,
  },
  {
    type: 'category',
    id: '3',
    title: 'Construction Materials',
    subtitle: 'Category',
    count: 512,
  },
  {
    type: 'brand',
    id: '4',
    title: 'ArcelorMittal',
    subtitle: 'Brand',
    count: 89,
  },
  {
    type: 'recent',
    id: '5',
    title: 'Heavy duty drill bits',
    subtitle: 'Recent search',
  },
]

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = 'Search for products, categories, or brands...',
  onSearch,
  showSuggestions = true,
  autoFocus = false,
}) => {
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage?.getItem('marketplace_recent_searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (_error) {}
    }
  }, [])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef?.current && !searchRef?.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery?.trim()) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Simulate API call - replace with actual API
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Filter mock suggestions based on query
        const filtered = mockSuggestions?.filter((item) =>
          item?.title?.toLowerCase().includes(searchQuery?.toLowerCase())
        )

        setSuggestions(filtered)
      } catch (_error) {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value
    setQuery(value)
    setSelectedIndex(-1)

    if (value?.trim()) {
      debouncedSearch(value)
      setIsOpen(true)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }

  // Handle search submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!query?.trim()) return

    // Save to recent searches
    const newRecent = [query, ...(recentSearches?.filter((s) => s !== query) || [])].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('marketplace_recent_searches', JSON.stringify(newRecent))

    // Navigate to search results
    router?.push(`/marketplace/search?q=${encodeURIComponent(query)}`)

    // Call onSearch callback if provided
    onSearch?.(query)

    // Close suggestions
    setIsOpen(false)
    inputRef?.current?.blur()
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      router?.push(`/marketplace/categories/${suggestion.id}`)
    } else if (suggestion.type === 'brand') {
      router?.push(`/marketplace/brands/${suggestion.id}`)
    } else {
      setQuery(suggestion.title)
      handleSubmit()
    }

    setIsOpen(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e?.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e?.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e?.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef?.current?.blur()
        break
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef?.current?.focus()
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'category':
        return <Package className="w-4 h-4 text-blue-600" />
      case 'brand':
        return <Tag className="w-4 h-4 text-purple-600" />
      default:
        return <Search className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Filter button */}
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2 text-gray-600 hover:text-gray-900"
            onClick={() =>
              router?.push(`/marketplace/search?q=${encodeURIComponent(query)}&filters=open`)
            }
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Recent Searches
              </h3>
              <div className="space-y-1">
                {recentSearches?.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search)
                      handleSubmit()
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm">{search}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {!query && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Steel Plates', 'Welding Tools', 'Safety Gear', 'Drill Bits'].map((trend) => (
                  <button
                    key={trend}
                    onClick={() => {
                      setQuery(trend)
                      handleSubmit()
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded-full transition-colors"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {query && suggestions.length > 0 && (
            <div className="py-2">
              {suggestions?.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors',
                    selectedIndex === index && 'bg-gray-50'
                  )}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</p>
                    {suggestion.subtitle && (
                      <p className="text-xs text-gray-500">{suggestion.subtitle}</p>
                    )}
                  </div>
                  {suggestion.count && (
                    <span className="text-xs text-gray-400">({suggestion.count})</span>
                  )}
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query && !isLoading && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try searching with different keywords</p>
            </div>
          )}

          {/* View all results */}
          {query && suggestions.length > 0 && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
