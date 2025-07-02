// apps/web/src/hooks/use-performance.ts
import { useCallback, useMemo, useRef } from 'react'
import { debounce } from '@erp/utils'

export function useOptimizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay = 300
) {
  const searchFunction = useCallback((term: string, items: T[], fields: (keyof T)[]) => {
    if (!term) return items
    return items.filter(item =>
      fields.some(field =>
        String(item[field]).toLowerCase().includes(term.toLowerCase())
      )
    )
  }, [])

  const debouncedSearch = useRef(debounce(searchFunction, delay)).current

  return useMemo(() => {
    return debouncedSearch(searchTerm, data, searchFields)
  }, [searchTerm, data, searchFields, debouncedSearch])
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps)
}
