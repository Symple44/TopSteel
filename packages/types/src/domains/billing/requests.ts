/**
 * 💰 REQUESTS BILLING - TopSteel ERP
 * Types de requêtes pour le domaine facturation
 * Fichier: packages/types/src/domains/billing/requests.ts
 */

import type { LigneDevis, LigneFacture } from './entities'
import type { FactureType, PaiementType, PaiementMethode } from './enums'

/**
 * Requête de création de devis
 */
export interface CreateDevisRequest {
  clientId: string
  projetId?: string
  dateValidite: Date
  lignes: Omit<LigneDevis, 'id' | 'devisId' | 'totalHT' | 'createdAt' | 'updatedAt'>[]
  conditions: string
  notes?: string
  remiseGlobale?: number
}

/**
 * Requête de création de facture
 */
export interface CreateFactureRequest {
  clientId: string
  devisId?: string
  projetId?: string
  type: FactureType
  dateEcheance: Date
  lignes: Omit<LigneFacture, 'id' | 'factureId' | 'createdAt' | 'updatedAt'>[]
  conditions: string
}

/**
 * Requête de création de paiement
 */
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