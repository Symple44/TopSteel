/**
 * 📦 ENTITÉS STOCK - TopSteel ERP
 * Entities principales du domaine stock
 * Fichier: packages/types/src/domains/stock/entities.ts
 */

import type { BaseEntity } from '../../core/base'

/**
 * Interface pour les statistiques de mouvements
 * Version moderne avec support ISO dates et métadonnées
 */
export interface MouvementStats {
  /** Date au format ISO string pour compatibilité JSON/API */
  date: string
  /** Nom lisible de la période */
  name: string
  /** Nombre d'entrées */
  entrees: number
  /** Nombre de sorties */
  sorties: number
  /** Nombre de transferts */
  transferts: number
  /** Valeur totale des entrées en euros */
  valeurEntrees: number
  /** Valeur totale des sorties en euros */
  valeurSorties: number
  /** Métadonnées optionnelles pour extensions futures */
  metadata?: Record<string, unknown>
}

/**
 * Types pour les mouvements de stock
 */
export type MouvementType = 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT' | 'RETOUR'
export type MouvementStatut = 'VALIDE' | 'PENDING' | 'ANNULE'

/**
 * Interface pour un mouvement individuel
 * Version évoluée avec traçabilité et audit
 */
export interface Mouvement extends BaseEntity {
  /** Type de mouvement */
  type: MouvementType
  /** Date au format ISO */
  date: string
  /** Quantité (peut être négative pour ajustements) */
  quantite: number
  /** Valeur unitaire en euros */
  valeurUnitaire: number
  /** Valeur totale calculée */
  valeurTotale: number
  /** Référence de l'article */
  reference: string
  /** Description optionnelle */
  description?: string
  /** Utilisateur responsable du mouvement */
  userId?: string
  /** Numéro de document associé (commande, facture, etc.) */
  documentRef?: string
  /** Statut du mouvement */
  statut: MouvementStatut
  /** Données d'audit */
  audit: {
    createdAt: string
    createdBy: string
    updatedAt?: string
    updatedBy?: string
  }
}

/**
 * Types pour l'état du stock
 */
export type StockStatut = 'ACTIF' | 'OBSOLETE' | 'SUSPENDU'
export type NiveauAlerte = 'OK' | 'BAS' | 'CRITIQUE' | 'RUPTURE'

/**
 * Interface pour l'état du stock
 * Version moderne avec alertes et optimisations
 */
export interface Stock extends BaseEntity {
  /** Référence de l'article */
  reference: string
  /** Nom de l'article */
  nom: string
  /** Description détaillée */
  description?: string
  /** Quantité actuelle en stock */
  quantite: number
  /** Quantité minimum (seuil d'alerte) */
  quantiteMin: number
  /** Quantité maximum recommandée */
  quantiteMax?: number
  /** Quantité réservée (non disponible) */
  quantiteReservee: number
  /** Quantité disponible (calculée) */
  quantiteDisponible: number
  /** Unité de mesure */
  unite: string
  /** Valeur unitaire actuelle */
  valeurUnitaire: number
  /** Valeur totale du stock */
  valeurTotale: number
  /** Emplacement de stockage */
  emplacement?: string
  /** Code-barres ou QR code */
  codeBarres?: string
  /** Catégorie de l'article */
  categorie?: string
  /** Dernière date de mouvement */
  dernierMouvement?: string
  /** Statut de l'article */
  statut: StockStatut
  /** Niveau d'alerte calculé */
  niveauAlerte: NiveauAlerte
  /** Données d'audit */
  audit: {
    createdAt: string
    updatedAt: string
  }
}

/**
 * Filtres pour les articles en stock
 */
export interface StockFilters {
  references?: string[]
  categories?: string[]
  statuts?: StockStatut[]
  niveauxAlerte?: NiveauAlerte[]
  quantiteMin?: number
  quantiteMax?: number
  valeurMin?: number
  valeurMax?: number
  emplacements?: string[]
  search?: string
  dateDebut?: Date
  dateFin?: Date
}

/**
 * Filtres pour les mouvements
 */
export interface MouvementFilters {
  types?: MouvementType[]
  statuts?: MouvementStatut[]
  references?: string[]
  userIds?: string[]
  dateDebut?: Date
  dateFin?: Date
  valeurMin?: number
  valeurMax?: number
  search?: string
}
