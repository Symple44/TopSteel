/**
 * 👤 ENTITÉS USER - TopSteel ERP
 * Entités principales du domaine utilisateur
 * Fichier: packages/types/src/domains/user/entities.ts
 */

import type { BaseEntity } from '../../core/base'
import type { UserRole } from './enums'

/**
 * Entité Utilisateur
 */
export interface User extends BaseEntity {
  email: string
  nom: string
  prenom: string
  // Compatibilité avec l'ancien format
  firstName?: string
  lastName?: string
  avatar?: string
  role: UserRole | string // Support des anciens rôles string
  telephone?: string
  isActive: boolean
  lastLogin?: Date
  permissions: string[]
}

/**
 * Tokens d'authentification
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Filtres pour les utilisateurs
 */
export interface UserFilters {
  roles?: (UserRole | string)[]
  isActive?: boolean
  permissions?: string[]
  search?: string
  dateCreationDebut?: Date
  dateCreationFin?: Date
  lastLoginDebut?: Date
  lastLoginFin?: Date
}
