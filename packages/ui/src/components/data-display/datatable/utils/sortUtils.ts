import type { ColumnConfig, SortConfig } from '../types'

/**
 * Nettoie les balises HTML d'une chaîne
 */
export function cleanHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

/**
 * Compare deux valeurs pour le tri
 */
export function compareValues(aVal: unknown, bVal: unknown, direction: 'asc' | 'desc'): number {
  // Gérer les valeurs null/undefined
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return direction === 'desc' ? 1 : -1
  if (bVal == null) return direction === 'desc' ? -1 : 1

  // Pour les chaînes, nettoyer les balises HTML si nécessaire
  if (typeof aVal === 'string' && aVal.includes('<')) {
    aVal = cleanHtmlTags(aVal)
  }
  if (typeof bVal === 'string' && bVal.includes('<')) {
    bVal = cleanHtmlTags(bVal)
  }

  // Si les valeurs sont égales
  if (aVal === bVal) return 0

  // Comparaison type-safe
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    const comparison = aVal.localeCompare(bVal)
    return direction === 'desc' ? -comparison : comparison
  }

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    const comparison = aVal - bVal
    return direction === 'desc' ? -comparison : comparison
  }

  if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
    const comparison = Number(aVal) - Number(bVal)
    return direction === 'desc' ? -comparison : comparison
  }

  if (aVal instanceof Date && bVal instanceof Date) {
    const comparison = aVal.getTime() - bVal.getTime()
    return direction === 'desc' ? -comparison : comparison
  }

  // Pour les autres types, convertir en string pour la comparaison
  const aStr = String(aVal)
  const bStr = String(bVal)
  const comparison = aStr.localeCompare(bStr)
  return direction === 'desc' ? -comparison : comparison
}

/**
 * Obtient la valeur d'une colonne pour une ligne donnée
 */
export function getColumnValue<T>(
  row: T,
  column: ColumnConfig<T> | undefined,
  columnKey: string
): unknown {
  if (column?.getValue) {
    return column.getValue(row)
  }

  // Type-safe property access
  const key = column?.key || columnKey
  if (typeof row === 'object' && row !== null && key in row) {
    return (row as Record<string, unknown>)[key]
  }

  return undefined
}

/**
 * Applique le tri sur un tableau de données
 */
export function sortData<T>(data: T[], sortConfigs: SortConfig[], columns: ColumnConfig<T>[]): T[] {
  if (!sortConfigs || sortConfigs.length === 0) return data

  const sorted = [...data]

  // Appliquer chaque configuration de tri dans l'ordre
  sortConfigs.forEach((sortConfig) => {
    sorted.sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.column)

      const aVal = getColumnValue(a, column, sortConfig.column)
      const bVal = getColumnValue(b, column, sortConfig.column)

      return compareValues(aVal, bVal, sortConfig.direction)
    })
  })

  return sorted
}

/**
 * Cycle la direction de tri (desc -> asc -> null)
 */
export function cycleSortDirection(
  currentDirection: 'asc' | 'desc' | undefined
): 'asc' | 'desc' | null {
  if (currentDirection === 'desc') return 'asc'
  if (currentDirection === 'asc') return null
  return 'desc'
}

/**
 * Met à jour la configuration de tri pour une colonne
 */
export function updateSortConfig(
  sortConfigs: SortConfig[],
  columnId: string,
  forceDirection?: 'asc' | 'desc' | null
): SortConfig[] {
  const existing = sortConfigs.find((s) => s.column === columnId)

  // Si forceDirection est null, supprimer le tri
  if (forceDirection === null) {
    return sortConfigs.filter((s) => s.column !== columnId)
  }

  // Si une direction est forcée, l'utiliser
  if (forceDirection === 'asc' || forceDirection === 'desc') {
    if (existing) {
      return sortConfigs.map((s) =>
        s.column === columnId ? { ...s, direction: forceDirection } : s
      )
    } else {
      return [...sortConfigs, { column: columnId, direction: forceDirection }]
    }
  }

  // Si forceDirection est undefined, utiliser la logique de cycle
  if (forceDirection === undefined) {
    if (existing) {
      const newDirection = cycleSortDirection(existing.direction)
      if (newDirection === null) {
        return sortConfigs.filter((s) => s.column !== columnId)
      }
      return sortConfigs.map((s) => (s.column === columnId ? { ...s, direction: newDirection } : s))
    } else {
      return [...sortConfigs, { column: columnId, direction: 'desc' }]
    }
  }

  return sortConfigs
}

/**
 * Vérifie si une colonne est triable
 */
export function isColumnSortable<T>(
  column: ColumnConfig<T>,
  globalSortable: boolean = true
): boolean {
  // Si la colonne a une propriété sortable définie, l'utiliser
  if (column.sortable !== undefined) {
    return column.sortable
  }
  // Sinon utiliser le paramètre global
  return globalSortable
}

/**
 * Obtient l'état de tri pour une colonne
 */
export function getColumnSortState(
  columnId: string,
  sortConfigs: SortConfig[]
): 'asc' | 'desc' | null {
  const config = sortConfigs.find((s) => s.column === columnId)
  return config ? config.direction : null
}

/**
 * Réinitialise tous les tris
 */
export function clearAllSorts(): SortConfig[] {
  return []
}

/**
 * Applique un tri multi-colonnes
 * (utile pour trier par plusieurs colonnes en même temps)
 */
export function multiColumnSort<T>(
  data: T[],
  sortConfigs: SortConfig[],
  columns: ColumnConfig<T>[]
): T[] {
  if (!sortConfigs || sortConfigs.length === 0) return data

  const sorted = [...data]

  sorted.sort((a, b) => {
    // Parcourir toutes les configurations de tri
    for (const sortConfig of sortConfigs) {
      const column = columns.find((col) => col.id === sortConfig.column)

      const aVal = getColumnValue(a, column, sortConfig.column)
      const bVal = getColumnValue(b, column, sortConfig.column)

      const comparison = compareValues(aVal, bVal, sortConfig.direction)

      // Si les valeurs sont différentes, retourner le résultat
      if (comparison !== 0) {
        return comparison
      }
      // Si les valeurs sont égales, passer à la colonne suivante
    }

    // Si toutes les colonnes sont égales
    return 0
  })

  return sorted
}
