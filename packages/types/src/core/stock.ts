/**
 * 📦 @erp/types - Types pour la gestion de stock
 * Types et interfaces pour les mouvements de stock dans TopSteel ERP
 */

/**
 * Types de mouvements de stock
 */
export enum StockMovementType {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  TRANSFERT = 'TRANSFERT',
  INVENTAIRE = 'INVENTAIRE',
  CORRECTION_POSITIVE = 'CORRECTION_POSITIVE',
  CORRECTION_NEGATIVE = 'CORRECTION_NEGATIVE',
  RETOUR = 'RETOUR',
  RESERVATION = 'RESERVATION',
}

/**
 * Statuts des mouvements de stock
 */
export enum StockMovementStatus {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  COMPLETE = 'COMPLETE',
  ANNULE = 'ANNULE',
  ERREUR = 'ERREUR',
}

/**
 * Priorités des mouvements de stock
 */
export enum StockMovementPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

/**
 * Raisons des mouvements de stock
 */
export enum StockMovementReason {
  ACHAT = 'ACHAT',
  VENTE = 'VENTE',
  PRODUCTION = 'PRODUCTION',
  AJUSTEMENT = 'AJUSTEMENT',
  INVENTAIRE = 'INVENTAIRE',
  RETOUR_CLIENT = 'RETOUR_CLIENT',
  RETOUR_FOURNISSEUR = 'RETOUR_FOURNISSEUR',
  TRANSFERT_SITE = 'TRANSFERT_SITE',
  CONSOMMATION = 'CONSOMMATION',
  PERTE = 'PERTE',
  VOL = 'VOL',
  DETERIORATION = 'DETERIORATION',
  PEREMPTION = 'PEREMPTION',
  AUTRE = 'AUTRE',
}
