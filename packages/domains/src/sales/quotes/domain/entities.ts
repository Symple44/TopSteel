/**
 * 💰 ENTITÉS MÉTIER - DOMAINE QUOTES (DEVIS)
 * Logique métier pure pour les devis
 */

import type { BaseEntity } from '../../../core/base'

// ===== ENUMS MÉTIER =====

export enum QuoteStatut {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE',
  ANNULE = 'ANNULE',
}

export enum QuoteType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SUR_MESURE = 'SUR_MESURE',
  MAINTENANCE = 'MAINTENANCE',
}

// ===== VALUE OBJECTS =====

export interface QuoteItem {
  readonly id: string
  readonly designation: string
  readonly description?: string
  readonly quantite: number
  readonly unite: string
  readonly prixUnitaireHT: number
  readonly remise?: number
  readonly totalHT: number
}

export interface QuoteTerms {
  readonly validiteJours: number
  readonly delaiLivraison?: string
  readonly conditionsPaiement: string
  readonly garantie?: string
  readonly modalitesLivraison?: string
}

export interface QuoteTotals {
  readonly sousTotal: number
  readonly remiseGlobale?: number
  readonly totalHT: number
  readonly totalTVA: number
  readonly totalTTC: number
  readonly acompte?: number
}

// ===== ENTITÉ PRINCIPALE =====

export interface Quote extends BaseEntity {
  // Identification
  readonly numero: string
  readonly reference?: string
  readonly type: QuoteType
  readonly statut: QuoteStatut

  // Relations
  readonly clientId: string
  readonly projetId?: string
  readonly commercialId: string

  // Contenu
  readonly objet: string
  readonly description?: string
  readonly items: QuoteItem[]

  // Financier
  readonly totals: QuoteTotals
  readonly tauxTVA: number
  readonly devise: string

  // Conditions
  readonly terms: QuoteTerms
  readonly notes?: string

  // Dates
  readonly dateCreation: Date
  readonly dateEnvoi?: Date
  readonly dateValidite: Date
  readonly dateReponse?: Date

  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
}

// ===== AGRÉGATS =====

export interface QuoteStats {
  readonly total: number
  readonly parStatut: Record<QuoteStatut, number>
  readonly tauxAcceptation: number
  readonly montantTotal: number
  readonly montantMoyen: number
  readonly delaiMoyenReponse: number
}

export interface QuoteWithDetails extends Quote {
  readonly client: {
    nom: string
    email: string
    telephone: string
  }
  readonly commercial: {
    nom: string
    prenom: string
    email: string
  }
  readonly historique: {
    date: Date
    action: string
    utilisateur: string
    commentaire?: string
  }[]
}
