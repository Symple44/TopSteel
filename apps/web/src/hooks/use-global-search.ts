'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { apiClient } from '@/lib/api-client-instance'

export interface SearchResult {
  type: string
  id: string
  title: string
  description?: string
  url?: string
  icon?: string
  metadata?: Record<string, any>
  score?: number
  highlight?: {
    title?: string[]
    description?: string[]
  }
}

export interface SearchResponse {
  results: SearchResult[]
  total: number | { value: number; relation: string }
  took: number
  searchEngine: 'elasticsearch' | 'postgresql'
  suggestions?: string[]
  facets?: Record<string, { value: string; count: number }[]>
}

export interface UseGlobalSearchOptions {
  limit?: number
  types?: string[]
  autoFocus?: boolean
  minChars?: number
  debounceMs?: number
}

interface SearchHistoryItem {
  query: string
  timestamp: number
  resultCount: number
}

const SEARCH_HISTORY_KEY = 'topsteel_search_history'
const MAX_HISTORY_ITEMS = 10

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const { limit = 20, types, autoFocus = false, minChars = 2, debounceMs = 300 } = options

  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]>>({})
  const [searchEngine, setSearchEngine] = useState<'elasticsearch' | 'postgresql'>('postgresql')
  const [searchTime, setSearchTime] = useState(0)
  const [total, setTotal] = useState(0)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, debounceMs)

  // Charger l'historique de recherche
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const parsedHistory = JSON.parse(stored)
        // Valider et nettoyer l'historique
        const validHistory = parsedHistory.filter(
          (item: any) =>
            item &&
            typeof item.query === 'string' &&
            typeof item.timestamp === 'number' &&
            typeof item.resultCount === 'number'
        )
        setHistory(validHistory)

        // Si aucun élément valide trouvé, nettoyer le localStorage
        if (validHistory.length !== parsedHistory.length) {
          if (validHistory.length === 0) {
            localStorage.removeItem(SEARCH_HISTORY_KEY)
          } else {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(validHistory))
          }
        }
      }
    } catch (_error) {
      // Nettoyer le localStorage en cas d'erreur
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    }
  }, [])

  // Sauvegarder l'historique
  const saveToHistory = useCallback(
    (searchQuery: string, resultCount: number) => {
      if (!searchQuery || searchQuery.length < minChars) return

      const newItem: SearchHistoryItem = {
        query: searchQuery,
        timestamp: Date.now(),
        resultCount,
      }

      setHistory((prev) => {
        // Éviter les doublons
        const filtered = prev.filter((item) => item.query !== searchQuery)
        const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)

        try {
          localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
        } catch (_error) {}

        return updated
      })
    },
    [minChars]
  )

  // Fonction de recherche principale
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < minChars) {
        setResults([])
        setSuggestions([])
        setFacets({})
        setTotal(0)
        return
      }

      // Annuler la recherche précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Créer un nouveau controller
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          limit: limit.toString(),
        })

        if (types && types.length > 0) {
          params.append('types', types.join(','))
        }

        const response = await apiClient.get(`/search/global?${params}`, {
          signal: abortControllerRef.current.signal,
        })

        if (response.data?.success && response.data.data) {
          const data: SearchResponse = response.data.data
          setResults(data.results)
          setSuggestions(data.suggestions || [])
          setFacets(data.facets || {})
          setSearchEngine(data.searchEngine)
          setSearchTime(data.took)
          setTotal(typeof data.total === 'object' ? data.total.value : data.total)

          // Sauvegarder dans l'historique
          saveToHistory(searchQuery, typeof data.total === 'object' ? data.total.value : data.total)
        } else {
          setResults([])
          setSuggestions([])
          setFacets({})
          setTotal(0)
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Erreur lors de la recherche')
          setResults([])
          setSuggestions([])
          setFacets({})
          setTotal(0)
        }
      } finally {
        setLoading(false)
      }
    },
    [minChars, limit, types, saveToHistory]
  )

  // Effectuer la recherche quand la query change (avec debounce)
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setSuggestions([])
      setFacets({})
      setTotal(0)
    }
  }, [debouncedQuery, performSearch])

  // Auto-focus si demandé
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocus])

  // Navigation clavier dans les résultats
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!results.length) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          clearSearch()
          break
      }
    },
    [results, selectedIndex, clearSearch, handleResultClick]
  )

  // Gestion du clic sur un résultat
  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.url) {
      // Navigation vers l'URL du résultat
      if (result.url.startsWith('http')) {
        window.open(result.url, '_blank')
      } else {
        window.location.href = result.url
      }
    }
  }, [])

  // Effacer la recherche
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setSuggestions([])
    setFacets({})
    setTotal(0)
    setSelectedIndex(-1)
    setError(null)
  }, [])

  // Rechercher depuis l'historique
  const searchFromHistory = useCallback((historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query)
  }, [])

  // Obtenir les suggestions basées sur l'historique
  const getHistorySuggestions = useCallback(
    (input: string): string[] => {
      if (!input || input.length < 2) return []

      const lowerInput = input.toLowerCase()
      return history
        .filter((item) => item.query.toLowerCase().includes(lowerInput))
        .map((item) => item.query)
        .slice(0, 5)
    },
    [history]
  )

  // Obtenir le statut du moteur de recherche
  const getEngineStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/search/status')
      return response.data?.data
    } catch (_error) {
      return null
    }
  }, [])

  // Réindexer (admin seulement)
  const reindex = useCallback(async () => {
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('super_admin')) {
      throw new Error('Permission denied')
    }

    try {
      const response = await apiClient.post('/search/reindex')
      return response.data
    } catch (error) {
      throw error
    }
  }, [user])

  // Obtenir les facettes pour un type spécifique
  const getFacetsForType = useCallback(
    (type: string) => {
      return facets.types?.filter((f) => f.value === type) || []
    },
    [facets]
  )

  // Grouper les résultats par type
  const getGroupedResults = useCallback(() => {
    const grouped: Record<string, SearchResult[]> = {}

    results.forEach((result) => {
      if (!grouped[result.type]) {
        grouped[result.type] = []
      }
      grouped[result.type].push(result)
    })

    return grouped
  }, [results])

  // Obtenir le nombre de résultats par type
  const getResultCountByType = useCallback(
    (type: string): number => {
      return results.filter((r) => r.type === type).length
    },
    [results]
  )

  return {
    // État
    query,
    results,
    loading,
    error,
    suggestions,
    facets,
    searchEngine,
    searchTime,
    total,
    history,
    selectedIndex,

    // Actions
    setQuery,
    clearSearch,
    searchFromHistory,
    handleResultClick,
    handleKeyDown,
    reindex,

    // Helpers
    getHistorySuggestions,
    getEngineStatus,
    getFacetsForType,
    getGroupedResults,
    getResultCountByType,

    // Refs
    searchInputRef,
  }
}

// Hook simplifié pour usage basique
export function useSearch(query: string, options?: UseGlobalSearchOptions) {
  const search = useGlobalSearch(options)

  useEffect(() => {
    search.setQuery(query)
  }, [query, search.setQuery])

  return {
    results: search.results,
    loading: search.loading,
    error: search.error,
    total: search.total,
  }
}
