/**
 * 🏪 ENTITÉS POUR STORES - TopSteel ERP
 * Types d'entités optimisés pour l'utilisation dans les stores
 * Évite les dépendances circulaires avec les types complets
 * Fichier: packages/types/src/store-entities.ts
 */

// Import des types existants pour éviter la duplication
import type { Client } from './client'
import type { Address } from './common'
import type { Devis } from './facturation'
import type { ProjetPriorite, ProjetStatut, ProjetType } from './projet'
import type { User } from './user'

// ===== ENTITÉS DE BASE =====

/**
 * Entité de base avec propriétés communes
 */
export interface BaseStoreEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// ===== UTILISATEUR POUR STORES =====

/**
 * Utilisateur pour les stores (alias vers User)
 */
export type StoreUser = User

// ===== CLIENT POUR STORES =====

/**
 * Client pour les stores (alias vers Client)
 */
export type StoreClient = Client

// ===== PROJET POUR STORES =====

/**
 * Document associé à un projet
 */
export interface StoreDocument {
  id: string
  nom: string
  type: 'pdf' | 'image' | 'document' | 'plan'
  url: string
  dateAjout: Date
  taille: number
  description?: string
}

/**
 * Devis pour les stores (alias vers Devis)
 */
export type StoreDevis = Devis

/**
 * Projet pour les stores - Compatible avec le type Projet existant
 */
export interface StoreProjet extends BaseStoreEntity {
  // Identifiants et références
  reference: string
  numero?: string

  // Informations de base
  description: string
  type: ProjetType
  statut: ProjetStatut
  priorite: ProjetPriorite

  // Dates
  dateCreation: Date
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  dateEcheance?: Date

  // Relations - COMPATIBLE avec Projet
  clientId: string
  client: Client // ✅ Obligatoire comme dans Projet
  responsableId?: string
  responsable?: User

  // Finances
  montantHT: number // ✅ Obligatoire comme dans Projet
  montantTTC: number // ✅ Obligatoire comme dans Projet
  tauxTVA: number // ✅ Obligatoire comme dans Projet
  marge: number // ✅ Obligatoire comme dans Projet
  budget?: number

  // Progression
  avancement: number // ✅ Obligatoire comme dans Projet
  progression?: number

  // Adresse - COMPATIBLE avec Projet
  adresseChantier: Address // ✅ Utilise le type Address existant

  // Métadonnées
  notes?: string
  commentaires?: string
  alertes?: string[]
  tags?: string[]

  // Relations avec autres entités - COMPATIBLE avec Projet
  devis?: Devis // ✅ Compatible avec Projet.devis
  documents?: StoreDocument[]
  documentsIds: string[] // ✅ Obligatoire comme dans Projet
  ordresFabricationIds: string[] // ✅ Obligatoire comme dans Projet

  // Champs calculés/dérivés
  enRetard?: boolean
  pourcentageAvancement?: number
  tempsEcoule?: number
  tempsRestant?: number

  // Champs métier spécifiques
  finition?: string
  materiauPrincipal?: string
  dimensions?: {
    largeur?: number
    hauteur?: number
    profondeur?: number
    surface?: number
    poids?: number
  }

  // Champs de workflow
  etapeActuelle?: string
  prochainActions?: string[]
  validations?: {
    technique?: boolean
    commerciale?: boolean
    production?: boolean
  }
}

// ===== ORDRE DE FABRICATION POUR STORES =====

/**
 * Ordre de fabrication simplifié pour les stores
 */
export interface StoreOrdreFabrication {
  id: string
  numero: string
  statut: 'EN_ATTENTE' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'
  description?: string
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  dateDebutReelle?: Date
  dateFinReelle?: Date
  avancement: number
  projetId?: string
  responsableId?: string
  createdAt: Date
  updatedAt: Date
}

// ===== STOCK POUR STORES =====

/**
 * Matériau/article en stock simplifié pour les stores
 */
export interface StoreMateriau {
  id: string
  reference: string
  nom: string
  description?: string
  type: string
  unite: string
  quantiteStock: number
  quantiteMinimale: number
  prixUnitaire?: number
  fournisseurPrincipal?: string
  emplacement?: string
  statut: 'ACTIF' | 'INACTIF' | 'RUPTURE'
  createdAt: Date
  updatedAt: Date
}

// ===== NOTIFICATION POUR STORES =====

/**
 * Notification pour les stores
 */
export interface StoreNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category?: 'SYSTEME' | 'PROJET' | 'PRODUCTION' | 'STOCK' | 'COMMERCIAL'
  read: boolean
  timestamp: Date
  userId?: string
  metadata?: {
    entityType?: string
    entityId?: string
    actionType?: string
    [key: string]: any
  }
  expiresAt?: Date
}

// ===== TYPES UTILITAIRES =====

/**
 * Types pour les filtres de projets - Compatible avec API existante
 */
export interface StoreProjetFilters {
  statut?: ProjetStatut[]
  priorite?: ProjetPriorite[]
  type?: ProjetType[]
  dateDebut?: Date // ✅ Compatible avec ProjetFilters existant
  dateFin?: Date // ✅ Compatible avec ProjetFilters existant
  dateEcheance?: { from?: string; to?: string }
  responsable?: string[]
  client?: string[] // ✅ Array de noms de clients pour recherche
  clientId?: string // ✅ ID unique d'un client spécifique
  search?: string // ✅ Compatible avec ProjetFilters existant
  tags?: string[]
  montantMin?: number
  montantMax?: number
  avancementMin?: number
  avancementMax?: number
  enRetard?: boolean
}

/**
 * Types pour les statistiques de projets
 */
export interface StoreProjetStats {
  total: number
  parStatut: Record<string, number>
  parPriorite: Record<string, number>
  parType: Record<string, number>
  enRetard: number
  terminesTemps: number
  avancementMoyen: number
  chiffreAffaireMensuel: number
  chiffreAffaireAnnuel: number
  margeGlobale: number
  projetsActifs: number
  nouveauxCeMois: number
}

/**
 * Types pour les métriques globales
 */
export interface StoreMetrics {
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

/**
 * Types pour l'état de synchronisation
 */
export interface StoreSyncState {
  isOnline: boolean
  pendingChanges: number
  lastSync: number
  conflictCount: number
  syncInProgress: boolean
  lastError?: string
  nextSyncTime?: number
  autoSyncEnabled: boolean
}

// ===== RE-EXPORTS DES TYPES IMPORTÉS =====

// Re-export des types pour faciliter l'accès
export type { Address, Client, Devis, ProjetPriorite, ProjetStatut, ProjetType, User }
