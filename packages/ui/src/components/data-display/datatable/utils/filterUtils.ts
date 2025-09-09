import type { ColumnConfig, FilterConfig } from '../types'

/**
 * Vérifie si une valeur est vide
 */
export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return true
    // Pour les richtext HTML, vérifier si le contenu est vide après suppression des balises
    if (value.includes('<')) {
      return value.replace(/<[^>]*>/g, '').trim() === ''
    }
  }
  return false
}

/**
 * Convertit une valeur en chaîne pour la comparaison
 */
export function valueToString(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }
  if (typeof value === 'string' && value.includes('<')) {
    // Pour les richtext, nettoyer les balises HTML
    return value.replace(/<[^>]*>/g, '').trim()
  }
  return String(value ?? '')
}

/**
 * Applique un filtre sur une valeur
 */
export function applyFilter(value: unknown, filter: FilterConfig): boolean {
  // Nouveau format de filtre avec objet structuré
  if (filter.value && typeof filter.value === 'object') {
    const filterValue = filter.value as Record<string, unknown>

    // Filtre par valeurs multiples (checkbox)
    if (filterValue.type === 'values' && Array.isArray(filterValue.values)) {
      const includesEmpty = filterValue.values.includes('(Vide)')
      const isEmpty = isEmptyValue(value)

      if (isEmpty && includesEmpty) return true
      if (!isEmpty) {
        const stringValue = valueToString(value)
        return filterValue.values.includes(stringValue)
      }
      return false
    }

    // Filtre par plage numérique
    if (filterValue.type === 'range') {
      const numValue = Number(value)
      if (Number.isNaN(numValue)) return false

      if (filterValue.min != null && numValue < Number(filterValue.min)) return false
      if (filterValue.max != null && numValue > Number(filterValue.max)) return false
      return true
    }

    // Filtre par plage de dates
    if (filterValue.type === 'dateRange') {
      const dateValue = new Date(value as string | number | Date)
      if (Number.isNaN(dateValue.getTime())) return false

      if (filterValue.start) {
        const startDate = new Date(filterValue.start as string | number | Date)
        if (dateValue < startDate) return false
      }
      if (filterValue.end) {
        const endDate = new Date(filterValue.end as string | number | Date)
        if (dateValue > endDate) return false
      }
      return true
    }
  }

  // Ancien format de filtre (compatibilité)
  return applyLegacyFilter(value, filter)
}

/**
 * Applique un filtre avec l'ancien format (compatibilité)
 */
function applyLegacyFilter(value: unknown, filter: FilterConfig): boolean {
  const stringValue = String(value || '').toLowerCase()
  const filterString = String(filter.value || '').toLowerCase()

  switch (filter.operator) {
    case 'equals':
      return value === filter.value
    case 'contains':
      return stringValue.includes(filterString)
    case 'startsWith':
      return stringValue.startsWith(filterString)
    case 'endsWith':
      return stringValue.endsWith(filterString)
    case 'gt':
      return Number(value) > Number(filter.value)
    case 'lt':
      return Number(value) < Number(filter.value)
    case 'gte':
      return Number(value) >= Number(filter.value)
    case 'lte':
      return Number(value) <= Number(filter.value)
    default:
      return true
  }
}

/**
 * Applique un filtre avancé sur une valeur
 */
export function applyAdvancedFilter<T>(
  value: unknown,
  rule: any,
  _column?: ColumnConfig<T>
): boolean {
  const stringValue = String(value || '').toLowerCase()
  const ruleValue = String((rule as any).value || '').toLowerCase()

  switch ((rule as any).operator) {
    case 'equals':
      return value === (rule as any).value
    case 'not_equals':
      return value !== (rule as any).value
    case 'contains':
      return stringValue.includes(ruleValue)
    case 'not_contains':
      return !stringValue.includes(ruleValue)
    case 'starts_with':
      return stringValue.startsWith(ruleValue)
    case 'ends_with':
      return stringValue.endsWith(ruleValue)
    case 'is_empty':
      return isEmptyValue(value)
    case 'is_not_empty':
      return !isEmptyValue(value)
    case 'greater_than':
      return Number(value) > Number((rule as any).value)
    case 'less_than':
      return Number(value) < Number((rule as any).value)
    case 'greater_or_equal':
      return Number(value) >= Number((rule as any).value)
    case 'less_or_equal':
      return Number(value) <= Number((rule as any).value)
    case 'between': {
      const num = Number(value)
      return num >= Number((rule as any).value) && num <= Number((rule as any).secondValue)
    }
    case 'in':
      return Array.isArray((rule as any).value) && (rule as any).value.includes(value)
    case 'not_in':
      return Array.isArray((rule as any).value) && !(rule as any).value.includes(value)
    default:
      return true
  }
}

/**
 * Filtre les données selon les filtres de colonnes
 */
export function filterDataByColumns<T extends Record<string, unknown>>(
  data: T[],
  filters: FilterConfig[],
  columns: ColumnConfig<T>[]
): T[] {
  if (!filters || filters.length === 0) return data

  return data.filter((row) => {
    return filters.every((filter) => {
      if (!filter.value && filter.value !== 0 && filter.value !== false) {
        return true
      }

      const column = columns.find((col) => col.id === filter.field)

      let value: any
      if (column?.getValue) {
        value = column.getValue(row)
      } else if (column?.accessor) {
        value =
          typeof column.accessor === 'function'
            ? column.accessor(row)
            : (row as any)[column.accessor as keyof T]
      } else {
        value = (row as any)[(filter.field || column?.key) as keyof T]
      }

      return applyFilter(value, filter)
    })
  })
}

/**
 * Filtre les données selon une recherche globale
 */
export function filterDataBySearch<T extends Record<string, unknown>>(
  data: T[],
  searchTerm: string,
  columns: ColumnConfig<T>[]
): T[] {
  if (!searchTerm || searchTerm.trim() === '') return data

  const searchLower = searchTerm.toLowerCase()

  return data.filter((row) => {
    return columns.some((column) => {
      if (!column.searchable) return false

      let value: any
      if (column.getValue) {
        value = column.getValue(row)
      } else if (column.accessor) {
        value =
          typeof column.accessor === 'function'
            ? column.accessor(row)
            : (row as any)[column.accessor as keyof T]
      } else {
        value = (row as any)[(column.key || column.id) as keyof T]
      }

      const stringValue = valueToString(value).toLowerCase()
      return stringValue.includes(searchLower)
    })
  })
}
