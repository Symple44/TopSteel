// packages/types/src/facturation.ts
import type { Client } from './client'
import type { BaseEntity } from './common'
import type { Projet } from './projet'
import type { User } from './user'

export enum DevisStatut {
  BROUILLON = 'brouillon',
  ENVOYE = 'envoye',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire'
}

export enum FactureStatut {
  BROUILLON = 'brouillon',
  ENVOYEE = 'envoyee',
  PAYEE = 'payee',
  PARTIELLE = 'partielle',
  EN_RETARD = 'en_retard',
  ANNULEE = 'annulee'
}

export enum FactureType {
  FACTURE = 'facture',
  AVOIR = 'avoir',
  ACOMPTE = 'acompte',
  SOLDE = 'solde'
}

export enum PaiementType {
  ENCAISSEMENT = 'encaissement',
  DECAISSEMENT = 'decaissement'
}

export enum PaiementMethode {
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  ESPECES = 'especes',
  CARTE = 'carte',
  PRELEVEMENT = 'prelevement'
}

export enum PaiementStatut {
  ATTENTE = 'attente',
  VALIDE = 'valide',
  ANNULE = 'annule'
}

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

export interface Relance extends BaseEntity {
  factureId: string
  type: 'automatique' | 'manuelle'
  niveau: 1 | 2 | 3
  dateEnvoi: Date
  methode: 'email' | 'courrier' | 'telephone'
  contenu: string
  statut: 'envoyee' | 'lue' | 'repondue'
}

// Requests
export interface CreateDevisRequest {
  clientId: string
  projetId?: string
  dateValidite: Date
  lignes: Omit<LigneDevis, 'id' | 'devisId' | 'totalHT' | 'createdAt' | 'updatedAt'>[]
  conditions: string
  notes?: string
  remiseGlobale?: number
}

export interface CreateFactureRequest {
  clientId: string
  devisId?: string
  projetId?: string
  type: FactureType
  dateEcheance: Date
  lignes: Omit<LigneFacture, 'id' | 'factureId' | 'createdAt' | 'updatedAt'>[]
  conditions: string
}

export interface CreatePaiementRequest {
  factureId?: string
  type: PaiementType
  methode: PaiementMethode
  montant: number
  dateOperation: Date
  dateValeur: Date
  reference: string
  compteId: string
  notes?: string
}

export interface FacturationFilters {
  statut?: string[]
  dateDebut?: Date
  dateFin?: Date
  clientId?: string
  commercialId?: string
  search?: string
}

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