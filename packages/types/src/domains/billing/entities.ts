/**
 * 💰 ENTITÉS BILLING - TopSteel ERP
 * Entités principales du domaine facturation
 * Fichier: packages/types/src/domains/billing/entities.ts
 */

import type { BaseEntity } from '../../core/base'
import type { Client } from '../client'
import type { Projet } from '../project'
import type { User } from '../user'
import type {
  DevisStatut,
  FactureStatut,
  FactureType,
  PaiementMethode,
  PaiementStatut,
  PaiementType,
  RelanceMethode,
  RelanceNiveau,
  RelanceStatut,
  RelanceType,
} from './enums'

/**
 * Entité Devis
 */
export interface Devis extends BaseEntity {
  reference: string
  clientId: string
  client: Client
  projetId?: string
  projet?: Projet
  statut: DevisStatut
  dateCreation: Date
  dateEnvoi?: Date
  dateValidite: Date
  dateReponse?: Date
  lignes: LigneDevis[]
  conditions: string
  notes?: string
  sousTotal: number
  remiseGlobale: number
  totalHT: number
  totalTVA: number
  totalTTC: number
  marge: number
  tauxMarge: number
  fichierPDF?: string
  commercialId?: string
  commercial?: User
}

/**
 * Ligne de devis
 */
export interface LigneDevis extends BaseEntity {
  devisId: string
  designation: string
  description?: string
  quantite: number
  unite: string
  prixUnitaire: number
  tauxTVA: number
  remise: number
  totalHT: number
  produitId?: string
  produit?: {
    reference: string
    nom: string
  }
  ordreLigne: number
}

/**
 * Entité Facture
 */
export interface Facture extends BaseEntity {
  numero: string
  clientId: string
  client: Client
  devisId?: string
  devis?: Devis
  projetId?: string
  projet?: Projet
  statut: FactureStatut
  type: FactureType
  dateEmission: Date
  dateEcheance: Date
  datePaiement?: Date
  lignes: LigneFacture[]
  conditions: string
  totalHT: number
  totalTVA: number
  totalTTC: number
  montantPaye: number
  montantRestant: number
  paiements: Paiement[]
  relances: Relance[]
  fichierPDF?: string
}

/**
 * Ligne de facture
 */
export interface LigneFacture extends BaseEntity {
  factureId: string
  designation: string
  quantite: number
  unite: string
  prixUnitaire: number
  tauxTVA: number
  totalHT: number
  ordreLigne: number
}

/**
 * Entité Paiement
 */
export interface Paiement extends BaseEntity {
  factureId?: string
  facture?: Facture
  type: PaiementType
  methode: PaiementMethode
  montant: number
  dateOperation: Date
  dateValeur: Date
  reference: string
  statut: PaiementStatut
  compteId: string
  compte: {
    nom: string
    banque: string
    numero: string
  }
  notes?: string
  pieceJointe?: string
}

/**
 * Entité Relance
 */
export interface Relance extends BaseEntity {
  factureId: string
  type: RelanceType
  niveau: RelanceNiveau
  dateEnvoi: Date
  methode: RelanceMethode
  contenu: string
  statut: RelanceStatut
}

/**
 * Filtres pour la facturation
 */
export interface FacturationFilters {
  statut?: string[]
  dateDebut?: Date
  dateFin?: Date
  clientId?: string
  commercialId?: string
  search?: string
}

/**
 * Statistiques de facturation
 */
export interface FacturationStats {
  caFacture: number
  caEncaisse: number
  caEnAttente: number
  caEnRetard: number
  nbDevis: number
  nbFactures: number
  tauxConversion: number
  delaiPaiementMoyen: number
}
