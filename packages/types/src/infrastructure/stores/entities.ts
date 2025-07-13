/**
 * 🏪 ENTITÉS POUR STORES - TopSteel ERP
 * Types d'entités optimisés pour l'utilisation dans les stores
 * Évite les dépendances circulaires avec les types complets
 * Fichier: packages/types/src/infrastructure/stores/entities.ts
 */

import type { Address } from '../../core/common'
import type { Devis } from '../../domains/billing'
// Import des types existants pour éviter la duplication
import type { Client } from '../../domains/client'
import type { ProjetPriorite, ProjetStatut, ProjetType } from '../../domains/project'
import type { User } from '../../domains/user'

// ===== ENTITÉS DE BASE =====

/**
 * Interface de base pour toutes les entités de store
 */
export interface BaseStoreEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// ===== ENTITÉS UTILISATEUR =====

/**
 * Représentation utilisateur optimisée pour les stores
 */
export interface StoreUser extends BaseStoreEntity {
  email: string
  nom: string
  prenom: string
  avatar?: string
  role: string
  permissions: string[]
  isActive: boolean
  lastLogin?: Date
}

// ===== ENTITÉS CLIENT =====

/**
 * Représentation client optimisée pour les stores
 */
export interface StoreClient extends BaseStoreEntity {
  nom: string
  email: string
  type: string
  adresse: Address
  telephone: string
  notes?: string
  isActif: boolean
  // Données business optionnelles
  chiffreAffaires?: number
  projetsActifs?: number
}

// ===== ENTITÉS PROJET =====

/**
 * Filtres spécifiques aux stores pour les projets
 */
export interface StoreProjetFilters {
  statuts?: string[]
  types?: string[]
  priorites?: string[]
  clientIds?: string[]
  dateDebutMin?: Date
  dateDebutMax?: Date
  dateFinMin?: Date
  dateFinMax?: Date
  montantMin?: number
  montantMax?: number
  search?: string
  // Filtres UI
  showArchived?: boolean
  showCompleted?: boolean
}

/**
 * Représentation projet optimisée pour les stores
 */
export interface StoreProjet extends BaseStoreEntity {
  reference: string
  description: string
  type: ProjetType
  statut: ProjetStatut
  priorite: ProjetPriorite

  // Dates
  dateCreation: Date
  dateDebut?: Date
  dateFin?: Date // Alias pour dateFinPrevue
  dateFinPrevue?: Date
  dateFinReelle?: Date

  // Client
  clientId: string
  client: Client // Référence complète pour l'affichage

  // Financier
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number

  // Avancement
  avancement: number // Pourcentage 0-100

  // Localisation
  adresseChantier: Address

  // Relations
  documentsIds: string[]
  documents?: any[] | any // Support pour les documents associés
  ordresFabricationIds: string[]
  devis?: Devis[] | Devis // Support pour les devis associés

  // UI State (pour les stores)
  isSelected?: boolean
  isEditing?: boolean
}

/**
 * Statistiques des projets pour les stores
 */
export interface StoreProjetStats {
  total: number
  enCours: number
  termines: number
  enRetard: number
  chiffreAffaireMois: number
  margeGlobale: number
  tauxReussite: number
  tempsMovenRealisation: number
}

// ===== ENTITÉS NOTIFICATIONS =====

/**
 * Notification optimisée pour les stores
 */
export interface StoreNotification extends BaseStoreEntity {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'

  // Statut
  isRead: boolean
  isArchived: boolean

  // Métadonnées
  userId?: string
  entityType?: string
  entityId?: string
  actionUrl?: string
  actionLabel?: string

  // Expiration
  expiresAt?: Date

  // UI State
  isVisible?: boolean
  timestamp: number
}

// ===== ENTITÉS MÉTRIQUES =====

/**
 * Métriques de performance pour les stores
 */
export interface StoreMetrics extends BaseStoreEntity {
  // Métriques générales
  totalUsers: number
  activeUsers: number
  totalProjects: number
  completedProjects: number

  // Performance
  averageResponseTime: number
  errorRate: number
  uptime: number

  // Business
  monthlyRevenue: number
  customerSatisfaction: number

  // Cache et sync
  cacheHitRate: number
  syncErrors: number
  lastSyncAt: Date
}

// ===== ENTITÉS SYNCHRONISATION =====

/**
 * État de synchronisation pour les stores
 */
export interface StoreSyncState {
  isOnline: boolean
  lastSync: Date
  pendingChanges: number
  syncErrors: string[]
  conflictsCount: number

  // États des modules
  modules: {
    projects: { lastSync: Date; errors: number }
    clients: { lastSync: Date; errors: number }
    production: { lastSync: Date; errors: number }
    billing: { lastSync: Date; errors: number }
  }
}
