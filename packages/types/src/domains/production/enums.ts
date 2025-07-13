/**
 * 🏭 PRODUCTION ENUMS - TopSteel ERP
 * Énumérations pour le domaine production
 */

/**
 * Statuts des ordres de fabrication
 */
export enum OrdreStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  PAUSE = 'PAUSE',
}

/**
 * Priorités des ordres de fabrication
 */
export enum OrdrePriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

/**
 * Statuts des opérations
 */
export enum OperationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  PAUSE = 'PAUSE',
  ANNULE = 'ANNULE',
}

/**
 * Types d'opérations de fabrication
 */
export enum TypeOperation {
  DECOUPE = 'DECOUPE',
  SOUDAGE = 'SOUDAGE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  PERCAGE = 'PERCAGE',
  PLIAGE = 'PLIAGE',
  USINAGE = 'USINAGE',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE',
}

/**
 * Statuts de contrôle qualité
 */
export enum QualiteStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFORME = 'CONFORME',
  NON_CONFORME = 'NON_CONFORME',
  RETOUCHE = 'RETOUCHE',
}

/**
 * Statuts des matériaux
 */
export enum MaterialStatus {
  REQUIS = 'REQUIS',
  COMMANDE = 'COMMANDE',
  RECU = 'RECU',
  UTILISE = 'UTILISE',
}

/**
 * Types de machines
 */
export enum TypeMachine {
  DECOUPE_PLASMA = 'DECOUPE_PLASMA',
  DECOUPE_LASER = 'DECOUPE_LASER',
  POSTE_SOUDAGE = 'POSTE_SOUDAGE',
  PERCEUSE = 'PERCEUSE',
  PLIEUSE = 'PLIEUSE',
  TOUR = 'TOUR',
  FRAISEUSE = 'FRAISEUSE',
}