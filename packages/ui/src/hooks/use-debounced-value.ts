'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook pour debouncer une valeur
 * Utile pour les champs de recherche afin de ne pas filtrer a chaque frappe
 *
 * @param value - La valeur a debouncer
 * @param delay - Le delai en millisecondes (defaut: 300ms)
 * @returns La valeur debouncee
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebouncedValue(searchTerm, 300)
 *
 * // Use debouncedSearch for filtering
 * const filteredData = useMemo(() => {
 *   return data.filter(item => item.name.includes(debouncedSearch))
 * }, [data, debouncedSearch])
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook pour debouncer une valeur avec controle manuel
 * Permet de forcer une mise a jour immediate si necessaire
 *
 * @param initialValue - La valeur initiale
 * @param delay - Le delai en millisecondes (defaut: 300ms)
 * @returns [value, debouncedValue, setValue, forceUpdate]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue)
    }, delay)
  }, [delay])

  const forceUpdate = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setDebouncedValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return [value, debouncedValue, updateValue, forceUpdate]
}

/**
 * Configuration pour le hook useDebounceSearch
 */
export interface UseDebounceSearchConfig {
  /** Delai de debounce en ms (defaut: 300) */
  delay?: number
  /** Longueur minimale pour declencher la recherche (defaut: 0) */
  minLength?: number
  /** Callback appele quand la recherche debouncee change */
  onDebouncedChange?: (value: string) => void
}

/**
 * Hook specialise pour la recherche avec debounce
 * Optimise pour les DataTables et listes filtrees
 *
 * @param config - Configuration du debounce
 * @returns Objet avec valeur immediate, debouncee et fonctions de controle
 */
export function useDebounceSearch(config: UseDebounceSearchConfig = {}) {
  const { delay = 300, minLength = 0, onDebouncedChange } = config

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Si la valeur est trop courte, reset immediatement
    if (value.length < minLength) {
      setDebouncedSearchTerm('')
      onDebouncedChange?.('')
      return
    }

    timerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value)
      onDebouncedChange?.(value)
    }, delay)
  }, [delay, minLength, onDebouncedChange])

  const clearSearch = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setSearchTerm('')
    setDebouncedSearchTerm('')
    onDebouncedChange?.('')
  }, [onDebouncedChange])

  const forceSearch = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (searchTerm.length >= minLength) {
      setDebouncedSearchTerm(searchTerm)
      onDebouncedChange?.(searchTerm)
    }
  }, [searchTerm, minLength, onDebouncedChange])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    /** Valeur immediate du champ de recherche */
    searchTerm,
    /** Valeur debouncee pour le filtrage */
    debouncedSearchTerm,
    /** Fonction pour mettre a jour la recherche */
    setSearchTerm: handleSearchChange,
    /** Vider la recherche */
    clearSearch,
    /** Forcer la mise a jour immediate */
    forceSearch,
    /** Indique si une recherche est en attente */
    isPending: searchTerm !== debouncedSearchTerm,
  }
}
