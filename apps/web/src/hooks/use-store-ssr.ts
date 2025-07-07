import { useCallback, useMemo } from 'react'

interface UseStoreSsrOptions<T> {
  fallback: T
  serverValue?: T
}

export function useStoreSsr<T>(options: UseStoreSsrOptions<T>) {
  const { fallback, serverValue } = options

  const _value = useMemo(() => {
    if (typeof window === 'undefined') {
      return serverValue ?? fallback
    }

    return fallback
  }, [fallback, serverValue])

  const _setValue = useCallback((newValue: T) => {
    // Implémentation du setter si nécessaire
    console.log('Setting value:', newValue)
  }, [])

  return [value, setValue] as const
}

