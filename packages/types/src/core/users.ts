/**
 * 👥 USERS - TopSteel ERP
 * Types pour la gestion des utilisateurs
 */

import type { BaseEntity } from './base'

/**
 * Statuts des utilisateurs
 */
export enum UserStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  EN_ATTENTE = 'EN_ATTENTE',
}

/**
 * Interface principale pour les utilisateurs
 */
export interface User extends BaseEntity, Record<string, unknown> {
  nom: string
  prenom: string
  email: string
  role: string
  avatar?: string
  permissions?: string[]
  societeId?: string
  societeCode?: string
  societeName?: string
  // Additional properties for consistency across the app
  firstName?: string // Alias for prenom
  lastName?: string // Alias for nom
  phone?: string
  department?: string
  isActive: boolean
  lastLogin?: string | Date
  // Role and group associations
  roles?: Array<{
    id: string
    name: string
    description?: string
    assignedAt?: string
    expiresAt?: string
  }>
  groups?: Array<{
    id: string
    name: string
    type?: string
    description?: string
    assignedAt?: string
  }>
}

/**
 * Filtres pour les utilisateurs
 */
export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  status?: UserStatus
  role?: string
  department?: string
  societeId?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Statistiques des utilisateurs
 */
export interface UserStatistics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  repartitionParRole: Record<string, number>
  repartitionParDepartement: Record<string, number>
  dernieresConnexions: Array<{
    userId: string
    lastLogin: Date
    userInfo: {
      nom: string
      prenom: string
      email: string
    }
  }>
}

/**
 * DTO pour créer un utilisateur
 */
export interface CreateUserDto {
  nom: string
  prenom: string
  email: string
  password?: string
  role?: string
  phone?: string
  department?: string
  societeId?: string
  avatar?: string
  permissions?: string[]
  isActive?: boolean
  roles?: Array<{
    id: string
    name: string
    description?: string
    assignedAt?: string
    expiresAt?: string
  }>
  groups?: Array<{
    id: string
    name: string
    type?: string
    description?: string
    assignedAt?: string
  }>
}

/**
 * DTO pour mettre à jour un utilisateur
 */
export interface UpdateUserDto extends Partial<CreateUserDto> {
  id: string
}
