// packages/utils/src/helpers/array.ts
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => string | number | symbol
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number | Date),
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const keyFn = typeof key === 'function' ? key : (item: T) => item[key]
  
  return [...array].sort((a, b) => {
    const aVal = keyFn(a)
    const bVal = keyFn(b)
    
    let comparison = 0
    if (aVal > bVal) comparison = 1
    if (aVal < bVal) comparison = -1
    
    return direction === 'desc' ? -comparison : comparison
  })
}

export function filterBy<T>(
  array: T[],
  filters: Partial<Record<keyof T, unknown>>
): T[] {
  return array.filter(item =>
    Object.entries(filters).every(([key, value]) =>
      value === undefined || item[key as keyof T] === value
    )
  )
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function uniqueBy<T, K>(
  array: T[],
  key: (item: T) => string | number | symbol
): T[] {
  const seen = new Set<K>()
  return array.filter(item => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
