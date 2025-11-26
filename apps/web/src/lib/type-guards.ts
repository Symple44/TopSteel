/**
 * Type Guards centralisés pour l'application TopSteel
 *
 * Ce fichier centralise tous les type guards utilisés dans l'application
 * pour éviter la duplication et assurer la cohérence des validations.
 */

import type { AuthTokens, Company, User } from './auth/auth-types'
import type { ExtendedUser } from './auth/rbac-types'

// ============================================
// TYPE GUARDS GÉNÉRIQUES
// ============================================

/**
 * Vérifie si une valeur est un objet non null
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Vérifie si un objet possède une propriété spécifique
 */
export function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj
}

/**
 * Récupère une propriété d'un objet de manière sécurisée avec valeur par défaut
 */
export function safeGet<T>(obj: unknown, prop: string, defaultValue: T): T {
  if (hasProperty(obj, prop)) {
    return (obj[prop] as T) ?? defaultValue
  }
  return defaultValue
}

// ============================================
// TYPE GUARDS UTILISATEUR
// ============================================

/**
 * Vérifie si un objet est un User valide
 */
export function isValidUser(user: unknown): user is User {
  return (
    isObject(user) &&
    'id' in user &&
    'email' in user &&
    'nom' in user &&
    'prenom' in user &&
    'role' in user &&
    'isActive' in user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string'
  )
}

/**
 * Vérifie si un utilisateur a des rôles société
 */
export function hasSocieteRoles(user: unknown): user is { societeRoles: unknown[] } {
  return (
    isObject(user) &&
    'societeRoles' in user &&
    Array.isArray(user.societeRoles)
  )
}

/**
 * Vérifie si un objet est un ExtendedUser valide
 */
export function isValidExtendedUser(user: unknown): user is ExtendedUser {
  return (
    isObject(user) &&
    'id' in user &&
    'email' in user &&
    'firstName' in user &&
    'lastName' in user &&
    'societeRoles' in user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    Array.isArray(user.societeRoles)
  )
}

/**
 * Vérifie si un objet possède une propriété role de type string
 */
export function hasRoleProperty(user: unknown): user is { role: string } {
  return (
    isObject(user) &&
    'role' in user &&
    typeof user.role === 'string'
  )
}

// ============================================
// TYPE GUARDS SOCIÉTÉ
// ============================================

/**
 * Vérifie si un objet est une Company valide
 */
export function isValidCompany(company: unknown): company is Company {
  return (
    isObject(company) &&
    'id' in company &&
    'nom' in company &&
    'code' in company &&
    typeof company.id === 'string' &&
    typeof company.nom === 'string' &&
    typeof company.code === 'string'
  )
}

/**
 * Vérifie si une société a la propriété isActive
 */
export function hasIsActiveProperty(obj: unknown): obj is { isActive: boolean } {
  return (
    isObject(obj) &&
    'isActive' in obj &&
    typeof obj.isActive === 'boolean'
  )
}

// ============================================
// TYPE GUARDS AUTHENTIFICATION
// ============================================

/**
 * Vérifie si un objet est un AuthTokens valide
 */
export function isValidAuthTokens(tokens: unknown): tokens is AuthTokens {
  return (
    isObject(tokens) &&
    'accessToken' in tokens &&
    'refreshToken' in tokens &&
    typeof tokens.accessToken === 'string' &&
    typeof tokens.refreshToken === 'string'
  )
}

/**
 * Vérifie si les tokens sont expirés
 */
export function areTokensExpired(tokens: AuthTokens): boolean {
  if (!tokens.expiresAt) return false
  return Date.now() >= tokens.expiresAt
}

// ============================================
// TYPE GUARDS API
// ============================================

/**
 * Interface pour les réponses API de succès
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/**
 * Interface pour les réponses API d'erreur
 */
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

/**
 * Type union pour les réponses API
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Vérifie si une réponse API est un succès
 */
export function isApiSuccess<T>(response: unknown): response is ApiSuccessResponse<T> {
  return (
    isObject(response) &&
    'success' in response &&
    response.success === true &&
    'data' in response
  )
}

/**
 * Vérifie si une réponse API est une erreur
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    isObject(response) &&
    'success' in response &&
    response.success === false &&
    'error' in response
  )
}

// ============================================
// TYPE GUARDS UTILITAIRES
// ============================================

/**
 * Vérifie si une valeur est une chaîne non vide
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Vérifie si une valeur est un tableau non vide
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Vérifie si une valeur est un nombre valide (non NaN, fini)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
}

/**
 * Vérifie si une valeur est une date valide
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Vérifie si une chaîne est une date ISO valide
 */
export function isValidISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

/**
 * Vérifie si une valeur est un UUID valide
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Vérifie si une valeur est un email valide
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}
