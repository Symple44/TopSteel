/**
 * 👥 CLIENT ENUMS - TopSteel ERP
 * Énumérations pour le domaine client
 */

/**
 * Types de clients
 */
export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE',
}

/**
 * Statuts des clients
 */
export enum ClientStatus {
  PROSPECT = 'PROSPECT',
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  ARCHIVE = 'ARCHIVE',
}

/**
 * Priorités client
 */
export enum ClientPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE',
}