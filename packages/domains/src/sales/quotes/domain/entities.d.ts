/**
 * 💰 ENTITÉS MÉTIER - DOMAINE QUOTES (DEVIS)
 * Logique métier pure pour les devis
 */
import type { BaseEntity } from '../../../core/base'
export declare enum QuoteStatut {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE',
  ANNULE = 'ANNULE',
}
export declare enum QuoteType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SUR_MESURE = 'SUR_MESURE',
  MAINTENANCE = 'MAINTENANCE',
}
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
export interface Quote extends BaseEntity {
  readonly numero: string
  readonly reference?: string
  readonly type: QuoteType
  readonly statut: QuoteStatut
  readonly clientId: string
  readonly projetId?: string
  readonly commercialId: string
  readonly objet: string
  readonly description?: string
  readonly items: QuoteItem[]
  readonly totals: QuoteTotals
  readonly tauxTVA: number
  readonly devise: string
  readonly terms: QuoteTerms
  readonly notes?: string
  readonly dateCreation: Date
  readonly dateEnvoi?: Date
  readonly dateValidite: Date
  readonly dateReponse?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
}
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
//# sourceMappingURL=entities.d.ts.map
