/**
 * 🔧 TYPES UTILITAIRES - TopSteel ERP
 * Types utilitaires avancés pour manipulation de types
 */

/**
 * Rend toutes les propriétés optionnelles de manière récursive
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Rend toutes les propriétés requises de manière récursive
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Extrait les clés dont les valeurs correspondent au type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * Construit un type avec les propriétés de T sauf celles de K
 */
export type Except<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Merge de deux types
 */
export type Merge<T, U> = Except<T, Extract<keyof T, keyof U>> & U

/**
 * Type pour rendre certaines propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Type pour rendre certaines propriétés requises
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Type pour les objets indexables
 */
export type Indexable<T = any> = Record<string, T>

/**
 * Type pour les fonctions génériques
 */
export type AnyFunction = (...args: unknown[]) => any

/**
 * Type pour les constructeurs
 */
export type Constructor<T = {}> = new (...args: unknown[]) => T

/**
 * Type pour les valeurs d'enum
 */
export type EnumValues<T> = T[keyof T]

/**
 * Type pour extraire le type de retour d'une promesse
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T

/**
 * Type pour extraire le type d'élément d'un tableau
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * Type pour rendre un type nullable
 */
export type Nullable<T> = T | null

/**
 * Type pour rendre un type optionnel ou null
 */
export type Optional<T> = T | null | undefined

/**
 * Type strictement typé pour Object.keys
 */
export type ObjectKeys<T> = keyof T

/**
 * Type pour les valeurs d'un objet
 */
export type ObjectValues<T> = T[keyof T]
