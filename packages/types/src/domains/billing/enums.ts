/**
 * 💰 ENUMS BILLING - TopSteel ERP
 * Énumérations pour le domaine facturation
 * Fichier: packages/types/src/domains/billing/enums.ts
 */

export enum DevisStatut {
  BROUILLON = 'brouillon',
  ENVOYE = 'envoye',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire',
}

export enum FactureStatut {
  BROUILLON = 'brouillon',
  ENVOYEE = 'envoyee',
  PAYEE = 'payee',
  PARTIELLE = 'partielle',
  EN_RETARD = 'en_retard',
  ANNULEE = 'annulee',
}

export enum FactureType {
  FACTURE = 'facture',
  AVOIR = 'avoir',
  ACOMPTE = 'acompte',
  SOLDE = 'solde',
}

export enum PaiementType {
  ENCAISSEMENT = 'encaissement',
  DECAISSEMENT = 'decaissement',
}

export enum PaiementMethode {
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  ESPECES = 'especes',
  CARTE = 'carte',
  PRELEVEMENT = 'prelevement',
}

export enum PaiementStatut {
  ATTENTE = 'attente',
  VALIDE = 'valide',
  ANNULE = 'annule',
}

// Types utilitaires
export type RelanceType = 'automatique' | 'manuelle'
export type RelanceNiveau = 1 | 2 | 3
export type RelanceMethode = 'email' | 'courrier' | 'telephone'
export type RelanceStatut = 'envoyee' | 'lue' | 'repondue'