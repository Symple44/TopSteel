// apps/web/src/hooks/use-optimized-component.ts
import { debounce } from '@erp/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useOptimizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay = 300
) {
  // Stockage du résultat filtré pour éviter les problèmes de type
  const [filteredData, setFilteredData] = useState<T[]>(data)

  // Fonction de recherche typée correctement
  const searchFunction = useCallback((...args: unknown[]) => {
    const [term, items, fields] = args as [string, T[], (keyof T)[]]
    const filtered = items.filter(item =>
      fields.some(field =>
        String(item[field]).toLowerCase().includes(term.toLowerCase())
      )
    )
    setFilteredData(filtered)
  }, [])

  // Création du debounce avec la fonction correcte
  const debouncedSearch = useRef(debounce(searchFunction, delay)).current

  // Effet pour déclencher la recherche
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(data)
    } else {
      debouncedSearch(searchTerm, data, searchFields)
    }
  }, [searchTerm, data, searchFields, debouncedSearch])

  return filteredData
}

// Fonction d'optimisation pour les composants lourds
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

// Hook pour optimiser les calculs coûteux avec deps non-undefined
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList = [] // Valeur par défaut pour éviter undefined
): T {
  return useMemo(factory, deps)
}

// Hook pour débounce d'une valeur
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}