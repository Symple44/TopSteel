/**
 * 🏪 ENTITÉS POUR STORES - TopSteel ERP
 * Types d'entités optimisés pour l'utilisation dans les stores
 * Évite les dépendances circulaires avec les types complets
 * Fichier: packages/types/src/infrastructure/stores/entities.ts
 */

import type { Address } from '../../core/common'

// Types simplifiés pour éviter les dépendances circulaires
// Les types complets sont maintenant dans @erp/domains

// Types locaux pour éviter la dépendance directe à @erp/domains
export enum ProjetType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  MAINTENANCE = 'MAINTENANCE',
  CONCEPTION = 'CONCEPTION',
  FABRICATION = 'FABRICATION',
  INSTALLATION = 'INSTALLATION',
}

export enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  DEVIS = 'DEVIS',
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  FACTURE = 'FACTURE',
  ANNULE = 'ANNULE',
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

/**
 * Client simplifié pour les stores
 */
export interface SimpleClient extends Record<string, unknown> {
  id: string
  nom: string
  email: string
  type: string
}

/**
 * Devis simplifié pour les stores
 */
export interface SimpleDevis extends Record<string, unknown> {
  id: string
  reference: string
  statut: string
  montantHT: number
}

// ===== ENTITÉS DE BASE =====

/**
 * Interface de base pour toutes les entités de store
 */
export interface BaseStoreEntity extends Record<string, unknown> {
  id: string
  createdAt: Date
  updatedAt: Date
}

// ===== ENTITÉS UTILISATEUR =====

/**
 * Représentation utilisateur optimisée pour les stores
 */
export interface StoreUser extends BaseStoreEntity, Record<string, unknown> {
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
export interface StoreClient extends BaseStoreEntity, Record<string, unknown> {
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
export interface StoreProjet extends BaseStoreEntity, Record<string, unknown> {
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
  client: SimpleClient // Référence simplifiée pour l'affichage

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
  documents?: unknown[] | any // Support pour les documents associés
  ordresFabricationIds: string[]
  devis?: SimpleDevis[] | SimpleDevis // Support pour les devis associés

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
export interface StoreNotification extends BaseStoreEntity, Record<string, unknown> {
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
export interface StoreMetrics extends BaseStoreEntity, Record<string, unknown> {
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

  // Métriques d'activité (pour app.store.ts)
  pageViews: number
  actionCount: number
  lastActivity: number
  sessionStart: number
  userCount: number
  projectCount: number
  orderCount: number
  revenue: number
  performance: {
    loadTime: number
    errorRate: number
    uptime: number
  }
}

// ===== ENTITÉS SYNCHRONISATION =====

/**
 * État de synchronisation pour les stores
 */
export interface StoreSyncState extends Record<string, unknown> {
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
