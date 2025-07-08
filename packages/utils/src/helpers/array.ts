// packages/utils/src/helpers/array.ts - TopSteel ERP Fixed Version

/**
 * Groupe un tableau d'éléments par une clé donnée
 * Version corrigée pour TypeScript strict mode
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K // ✅ Cohérence: retourne exactement K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = key(item) as K // ✅ Assertion de type explicite
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    },
    {} as Record<K, T[]>
  )
}

/**
 * Alternative plus sûre utilisant Map pour éviter les problèmes d'index
 */
export function groupByMap<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>()

  for (const item of array) {
    const groupKey = key(item)
    const existing = groups.get(groupKey)

    if (existing) {
      existing.push(item)
    } else {
      groups.set(groupKey, [item])
    }
  }

  return groups
}

/**
 * Version utilisant Partial<Record> pour plus de flexibilité
 */
export function groupByPartial<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K
): Partial<Record<K, T[]>> {
  const groups: Partial<Record<K, T[]>> = {}

  for (const item of array) {
    const groupKey = key(item)

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    const existingGroup = groups[groupKey]
    if (existingGroup) {
      existingGroup.push(item)
    }
  }

  return groups
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

export function filterBy<T>(array: T[], filters: Partial<Record<keyof T, unknown>>): T[] {
  return array.filter((item) =>
    Object.entries(filters).every(
      ([key, value]) => value === undefined || item[key as keyof T] === value
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

/**
 * Version corrigée de uniqueBy avec types cohérents
 */
export function uniqueBy<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K // ✅ Cohérence: retourne exactement K
): T[] {
  const seen = new Set<K>()
  return array.filter((item) => {
    const k = key(item) as K // ✅ Assertion de type explicite
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Alternative plus sûre pour uniqueBy utilisant Map
 */
export function uniqueByMap<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K
): T[] {
  const seen = new Map<K, boolean>()
  return array.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.set(k, true)
    return true
  })
}

// Fonctions utilitaires supplémentaires pour l'ERP TopSteel

/**
 * Groupe par plusieurs clés (utile pour données métallurgiques)
 */
export function groupByMultiple<T>(array: T[], keys: (keyof T)[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of array) {
    const compositeKey = keys.map((key) => String(item[key])).join('|')
    const existing = groups.get(compositeKey)

    if (existing) {
      existing.push(item)
    } else {
      groups.set(compositeKey, [item])
    }
  }

  return groups
}

/**
 * Partition en fonction d'un prédicat (utile pour séparer production/commandes)
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = []
  const falsy: T[] = []

  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item)
    } else {
      falsy.push(item)
    }
  }

  return [truthy, falsy]
}
