// apps/web/src/hooks/use-optimized-component.ts
import { useMemo, useCallback, useRef } from 'react'
import { debounce } from '@erp/utils'

export function useOptimizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay = 300
) {
  const debouncedSearch = useRef(
    debounce((term: string, items: T[], fields: (keyof T)[]) => {
      return items.filter(item =>
        fields.some(field =>
          String(item[field]).toLowerCase().includes(term.toLowerCase())
        )
      )
    }, delay)
  ).current

  return useMemo(() => {
    if (!searchTerm) return data
    return debouncedSearch(searchTerm, data, searchFields)
  }, [data, searchTerm, searchFields, debouncedSearch])
}