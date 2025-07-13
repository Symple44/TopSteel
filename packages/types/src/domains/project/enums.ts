/**
 * 🏗️ PROJECT ENUMS - TopSteel ERP
 * Énumérations pour le domaine projet
 */

/**
 * Statuts d'un projet
 */
export enum ProjetStatut {
  BROUILLON = 'brouillon',
  DEVIS = 'devis',
  EN_ATTENTE = 'en_attente',
  ACCEPTE = 'accepte',
  EN_COURS = 'en_cours',
  EN_PAUSE = 'en_pause',
  TERMINE = 'termine',
  ANNULE = 'annule',
  FACTURE = 'facture',
}

/**
 * Types de projets métallurgie
 */
export enum ProjetType {
  PORTAIL = 'PORTAIL',
  CLOTURE = 'CLOTURE',
  ESCALIER = 'ESCALIER',
  RAMPE = 'RAMPE',
  VERRIERE = 'VERRIERE',
  STRUCTURE = 'STRUCTURE',
  BARDAGE = 'BARDAGE',
  COUVERTURE = 'COUVERTURE',
  CHARPENTE = 'CHARPENTE',
  PHOTOVOLTAIQUE = 'PHOTOVOLTAIQUE',
  AUTRE = 'AUTRE',
}

/**
 * Priorités des projets
 */
export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

/**
 * Types de documents projet
 */
export enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PLAN = 'plan',
  DEVIS = 'devis',
  FACTURE = 'facture',
  PHOTO_CHANTIER = 'photo_chantier',
}
