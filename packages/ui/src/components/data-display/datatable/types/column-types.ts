import type { ReactNode } from 'react'

// ============================
// Base Column Types
// ============================

/**
 * Types de données supportés dans les colonnes
 */
export type DataValue = string | number | boolean | Date | null | undefined

/**
 * Types de colonnes disponibles
 */
export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'richtext'
  | 'custom'
  | 'formula'

/**
 * Configuration de base pour toutes les colonnes
 * Cette interface contient les propriétés communes à tous les types de colonnes
 */
export interface BaseColumnConfig {
  /** Identifiant unique de la colonne */
  id: string

  /** Clé pour accéder à la valeur dans l'objet de données */
  key: string

  /** Titre affiché dans l'en-tête */
  title: string

  /** Description pour les tooltips */
  description?: string

  /** Type de la colonne */
  type: ColumnType

  /** Largeur de la colonne */
  width?: number

  /** Largeur minimale */
  minWidth?: number

  /** Largeur maximale */
  maxWidth?: number

  /** La colonne peut être redimensionnée */
  resizable?: boolean

  /** La colonne peut être triée */
  sortable?: boolean

  /** La colonne est recherchable */
  searchable?: boolean

  /** La colonne est éditable */
  editable?: boolean

  /** La valeur est requise */
  required?: boolean

  /** La colonne est visible */
  visible?: boolean

  /** La colonne est verrouillée (non déplaçable) */
  locked?: boolean
}

/**
 * Configuration de validation pour une colonne
 */
export interface ColumnValidation {
  /** Valeur minimale (pour les nombres) */
  min?: number

  /** Valeur maximale (pour les nombres) */
  max?: number

  /** Pattern regex pour la validation */
  pattern?: RegExp

  /** Fonction de validation personnalisée */
  custom?: (value: unknown) => string | null

  /** Champ requis */
  required?: boolean

  /** Longueur minimale (pour les chaînes) */
  minLength?: number

  /** Longueur maximale (pour les chaînes) */
  maxLength?: number
}

/**
 * Options pour les colonnes de type select/multiselect
 */
export interface SelectOption {
  /** Valeur de l'option */
  value: DataValue

  /** Label affiché */
  label: string

  /** Couleur associée */
  color?: string

  /** Icône associée */
  icon?: ReactNode

  /** Option désactivée */
  disabled?: boolean
}

/**
 * Configuration de formatage pour une colonne
 */
export interface ColumnFormat {
  /** Nombre de décimales (pour les nombres) */
  decimals?: number

  /** Devise (pour les montants) */
  currency?: string

  /** Format de date */
  dateFormat?: string

  /** Préfixe */
  prefix?: string

  /** Suffixe */
  suffix?: string

  /** Fonction de transformation */
  transform?: (value: unknown) => string
}

/**
 * Configuration de formule pour les colonnes calculées
 */
export interface ColumnFormula {
  /** Expression de la formule (ex: "=A1+B1") */
  expression: string

  /** Colonnes dont dépend cette formule */
  dependencies: string[]

  /** Type de résultat attendu */
  resultType?: ColumnType
}

/**
 * Configuration complète d'une colonne avec type générique
 */
export interface ColumnConfig<T>
  extends BaseColumnConfig {
  /** Configuration de validation */
  validation?: ColumnValidation

  /** Options pour select/multiselect */
  options?: SelectOption[]

  /** Configuration de formatage */
  format?: ColumnFormat

  /** Configuration de formule */
  formula?: ColumnFormula

  /** Fonction de rendu personnalisé */
  render?: (value: unknown, row: T, column: ColumnConfig<T>) => ReactNode

  /** Fonction pour obtenir la valeur (propriétés imbriquées) */
  getValue?: (row: T) => unknown

  /** Alias pour getValue (compatibilité) */
  accessor?: ((row: T) => unknown) | string

  /** Callback lors de l'édition */
  onEdit?: (value: unknown, row: T, column: ColumnConfig<T>) => void

  /** Validation lors de l'édition */
  onValidate?: (value: unknown, row: T, column: ColumnConfig<T>) => string | null
}

// ============================
// Typed Column Configurations
// ============================

/**
 * Configuration pour une colonne de texte
 */
export interface TextColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'text'
  validation?: ColumnValidation & {
    pattern?: RegExp
    minLength?: number
    maxLength?: number
  }
}

/**
 * Configuration pour une colonne numérique
 */
export interface NumberColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'number'
  validation?: ColumnValidation & {
    min?: number
    max?: number
    step?: number
  }
  format?: ColumnFormat & {
    decimals?: number
    currency?: string
  }
}

/**
 * Configuration pour une colonne booléenne
 */
export interface BooleanColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'boolean'
  format?: ColumnFormat & {
    trueLabel?: string
    falseLabel?: string
    trueIcon?: ReactNode
    falseIcon?: ReactNode
  }
}

/**
 * Configuration pour une colonne de date
 */
export interface DateColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'date' | 'datetime'
  format?: ColumnFormat & {
    dateFormat?: string
    timeFormat?: string
    timezone?: string
  }
  validation?: ColumnValidation & {
    minDate?: Date | string
    maxDate?: Date | string
  }
}

/**
 * Configuration pour une colonne de sélection
 */
export interface SelectColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'select' | 'multiselect'
  options: SelectOption[]
  validation?: ColumnValidation & {
    minSelections?: number
    maxSelections?: number
  }
}

/**
 * Configuration pour une colonne avec formule
 */
export interface FormulaColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'formula'
  formula: ColumnFormula
  editable: false // Les colonnes calculées ne sont pas éditables
}

/**
 * Configuration pour une colonne personnalisée
 */
export interface CustomColumnConfig<T>
  extends ColumnConfig<T> {
  type: 'custom'
  render: (value: unknown, row: T, column: ColumnConfig<T>) => ReactNode
}

// ============================
// Type Guards
// ============================

/**
 * Vérifie si une colonne est de type texte
 */
export function isTextColumn<T>(
  column: ColumnConfig<T>
): column is TextColumnConfig<T> {
  return column.type === 'text'
}

/**
 * Vérifie si une colonne est de type numérique
 */
export function isNumberColumn<T>(
  column: ColumnConfig<T>
): column is NumberColumnConfig<T> {
  return column.type === 'number'
}

/**
 * Vérifie si une colonne est de type booléen
 */
export function isBooleanColumn<T>(
  column: ColumnConfig<T>
): column is BooleanColumnConfig<T> {
  return column.type === 'boolean'
}

/**
 * Vérifie si une colonne est de type date
 */
export function isDateColumn<T>(
  column: ColumnConfig<T>
): column is DateColumnConfig<T> {
  return column.type === 'date' || column.type === 'datetime'
}

/**
 * Vérifie si une colonne est de type sélection
 */
export function isSelectColumn<T>(
  column: ColumnConfig<T>
): column is SelectColumnConfig<T> {
  return column.type === 'select' || column.type === 'multiselect'
}

/**
 * Vérifie si une colonne est de type formule
 */
export function isFormulaColumn<T>(
  column: ColumnConfig<T>
): column is FormulaColumnConfig<T> {
  return column.type === 'formula'
}

/**
 * Vérifie si une colonne est de type personnalisé
 */
export function isCustomColumn<T>(
  column: ColumnConfig<T>
): column is CustomColumnConfig<T> {
  return column.type === 'custom'
}

// ============================
// Column Builder Helpers
// ============================

/**
 * Crée une configuration de colonne de texte
 */
export function createTextColumn<T>(
  config: Omit<TextColumnConfig<T>, 'type'>
): TextColumnConfig<T> {
  return { ...config, type: 'text' }
}

/**
 * Crée une configuration de colonne numérique
 */
export function createNumberColumn<T>(
  config: Omit<NumberColumnConfig<T>, 'type'>
): NumberColumnConfig<T> {
  return { ...config, type: 'number' }
}

/**
 * Crée une configuration de colonne booléenne
 */
export function createBooleanColumn<T>(
  config: Omit<BooleanColumnConfig<T>, 'type'>
): BooleanColumnConfig<T> {
  return { ...config, type: 'boolean' }
}

/**
 * Crée une configuration de colonne de date
 */
export function createDateColumn<T>(
  config: Omit<DateColumnConfig<T>, 'type'> & { type?: 'date' | 'datetime' }
): DateColumnConfig<T> {
  return { ...config, type: config.type || 'date' }
}

/**
 * Crée une configuration de colonne de sélection
 */
export function createSelectColumn<T>(
  config: Omit<SelectColumnConfig<T>, 'type'> & { type?: 'select' | 'multiselect' }
): SelectColumnConfig<T> {
  return { ...config, type: config.type || 'select' }
}

/**
 * Crée une configuration de colonne avec formule
 */
export function createFormulaColumn<T>(
  config: Omit<FormulaColumnConfig<T>, 'type' | 'editable'>
): FormulaColumnConfig<T> {
  return { ...config, type: 'formula', editable: false }
}

/**
 * Crée une configuration de colonne personnalisée
 */
export function createCustomColumn<T>(
  config: Omit<CustomColumnConfig<T>, 'type'>
): CustomColumnConfig<T> {
  return { ...config, type: 'custom' }
}
