// ===== UTILITAIRES DE TYPES ROBUSTES POUR ERP TOPSTEEL =====
// packages/types/src/guards.ts
// Résout les problèmes de exactOptionalPropertyTypes et améliore la robustesse générale

import type { ReactNode } from 'react'

// ===== TYPES DE BASE ROBUSTES =====

/**
 * Garantit qu'une valeur boolean | undefined devient boolean
 * Résout l'erreur exactOptionalPropertyTypes: true
 */
export type StrictBoolean<T> = T extends boolean | undefined ? boolean : T

/**
 * Garantit qu'une propriété optionnelle devient stricte
 */
export type StrictOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: NonNullable<T[P]>
}

/**
 * Types pour les colonnes de tableau avec validation (spécifiques aux guards)
 */
export interface GuardDataColumn<TData = any> {
  key: string
  label: string
  render?: (value: any, item: TData) => ReactNode
  sortable?: boolean
  required?: boolean
  type?: 'string' | 'number' | 'date' | 'boolean' | 'custom'
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

/**
 * État de colonne avec types stricts (spécifique aux guards)
 */
export interface GuardColumnState {
  [key: string]: boolean // Jamais undefined
}

/**
 * Props robustes pour les composants dropdown (spécifiques aux guards)
 */
export interface GuardDropdownProps {
  checked: boolean // Strictement boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  children?: ReactNode
}

// ===== GUARDS DE VALIDATION =====

/**
 * Vérifie si une valeur est un boolean valide
 */
export const isValidBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

/**
 * Vérifie si une valeur est définie et non null
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

/**
 * Vérifie si une valeur est un string non vide
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Vérifie si une valeur est un array valide
 */
export const isValidArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value)
}

/**
 * Vérifie si un objet a toutes les propriétés requises
 */
export const hasRequiredProps = <T extends Record<string, any>>(
  obj: unknown,
  requiredKeys: (keyof T)[]
): obj is T => {
  if (!obj || typeof obj !== 'object') return false
  return requiredKeys.every((key) => key in obj)
}

// ===== CONVERTISSEURS SÉCURISÉS =====

/**
 * Convertit une valeur en boolean avec fallback
 */
export const toStrictBoolean = (value: boolean | undefined, fallback = false): boolean => {
  return isValidBoolean(value) ? value : fallback
}

/**
 * Convertit une valeur en string avec fallback
 */
export const toSafeString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback
  try {
    return String(value)
  } catch {
    return fallback
  }
}

/**
 * Convertit une valeur en nombre avec fallback
 */
export const toSafeNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

/**
 * Convertit une valeur en array avec fallback
 */
export const toSafeArray = <T>(value: unknown, fallback: T[] = []): T[] => {
  return isValidArray<T>(value) ? value : fallback
}

// ===== BUILDERS D'ÉTAT ROBUSTES =====

/**
 * Crée un état de colonnes visible initial robuste
 */
export const createColumnVisibilityState = (
  columns: GuardDataColumn[],
  defaultVisible = true
): GuardColumnState => {
  const state: GuardColumnState = {}
  columns.forEach((column) => {
    if (isNonEmptyString(column.key)) {
      state[column.key] = toStrictBoolean(defaultVisible, true)
    }
  })
  return state
}

/**
 * Met à jour l'état de visibilité des colonnes de manière sûre
 */
export const updateColumnVisibility = (
  currentState: GuardColumnState,
  columnKey: string,
  visible?: boolean
): GuardColumnState => {
  if (!isNonEmptyString(columnKey)) {
    console.warn(`[updateColumnVisibility] Clé de colonne invalide: ${columnKey}`)
    return currentState
  }

  const currentValue = toStrictBoolean(currentState[columnKey], true)
  const newValue = isDefined(visible) ? toStrictBoolean(visible) : !currentValue

  return {
    ...currentState,
    [columnKey]: newValue,
  }
}

/**
 * Valide une colonne de données (version guard)
 */
export const validateGuardDataColumn = (column: unknown): column is GuardDataColumn => {
  if (!column || typeof column !== 'object') return false

  const col = column as any
  return isNonEmptyString(col.key) && isNonEmptyString(col.label)
}

// ===== HELPERS POUR FORMULAIRES =====

/**
 * Gère les changements de valeur dans les formulaires
 */
export const createFormChangeHandler = <T>(
  setter: (value: T) => void,
  validator?: (value: unknown) => value is T,
  fallback?: T
) => {
  return (value: unknown) => {
    if (validator && !validator(value)) {
      if (isDefined(fallback)) {
        setter(fallback)
      }
      return
    }
    setter(value as T)
  }
}

/**
 * Créée un handler pour les checkboxes robuste
 */
export const createCheckboxHandler = (setter: (checked: boolean) => void) => {
  return (checked: boolean | undefined) => {
    setter(toStrictBoolean(checked, false))
  }
}

// ===== UTILITAIRES DE RECHERCHE ET FILTRAGE =====

/**
 * Filtre les données de manière sécurisée
 */
export const safeFilterData = <T>(data: T[], predicate: (item: T) => boolean): T[] => {
  try {
    if (!isValidArray(data)) return []
    return data.filter(predicate)
  } catch (error) {
    console.error('[safeFilterData] Erreur lors du filtrage:', error)
    return data
  }
}

/**
 * Recherche textuelle sécurisée
 */
export const safeTextSearch = <T>(
  data: T[],
  searchTerm: string,
  searchableFields: (keyof T)[]
): T[] => {
  if (!isNonEmptyString(searchTerm)) return data
  if (!isValidArray(searchableFields)) return data

  const normalizedSearch = searchTerm.toLowerCase().trim()

  return safeFilterData(data, (item) => {
    return searchableFields.some((field) => {
      const value = toSafeString(item[field])
      return value.toLowerCase().includes(normalizedSearch)
    })
  })
}

// ===== HELPERS POUR LES STYLES =====

/**
 * Combine les classes CSS de manière sécurisée
 */
export const combineClassNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter((cls) => isNonEmptyString(cls))
    .join(' ')
    .trim()
}

/**
 * Applique des classes conditionnelles
 */
export const conditionalClasses = (
  baseClasses: string,
  conditions: Record<string, boolean>
): string => {
  const conditionalClasses = Object.entries(conditions)
    .filter(([, condition]) => toStrictBoolean(condition))
    .map(([className]) => className)

  return combineClassNames(baseClasses, ...conditionalClasses)
}
