/**
 * 🔍 API FILTERS - TopSteel ERP
 * Types pour le filtrage et la recherche
 */

/**
 * Opérateurs de filtrage disponibles
 */
export type FilterOperator = 
  | 'eq'       // égal
  | 'ne'       // différent
  | 'gt'       // plus grand
  | 'gte'      // plus grand ou égal
  | 'lt'       // plus petit
  | 'lte'      // plus petit ou égal
  | 'like'     // contient (recherche textuelle)
  | 'ilike'    // contient (insensible à la casse)
  | 'in'       // dans la liste
  | 'not_in'   // pas dans la liste
  | 'is_null'  // est null
  | 'not_null' // n'est pas null
  | 'between'  // entre deux valeurs

/**
 * Condition de filtrage
 */
export type FilterCondition<T = any> = {
  field: string
  operator: FilterOperator
  value: T
}

/**
 * Groupe de conditions avec opérateur logique
 */
export type FilterGroup = {
  operator: 'and' | 'or'
  conditions: (FilterCondition | FilterGroup)[]
}

/**
 * Filtre date avec options prédéfinies
 */
export type DateFilter = {
  type: 'preset' | 'custom'
  preset?: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year'
  from?: Date
  to?: Date
}

/**
 * Filtre numérique avec plage
 */
export type NumberFilter = {
  min?: number
  max?: number
  exact?: number
}

/**
 * Filtre pour les statuts/énums
 */
export type EnumFilter<T extends string = string> = {
  include?: T[]
  exclude?: T[]
}

/**
 * Configuration de filtre pour un champ
 */
export interface FilterConfig {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean'
  operators?: FilterOperator[]
  options?: Array<{ label: string; value: any }>
}