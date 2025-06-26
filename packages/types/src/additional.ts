// Types additionnels pour TopSteel ERP (séparés pour éviter les conflits)

// Enums pour la production
export enum StatutProduction {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  SUSPENDUE = 'suspendue'
}

export enum PrioriteProduction {
  BASSE = 'basse',
  NORMALE = 'normale',
  HAUTE = 'haute',
  URGENTE = 'urgente'
}

// Enums pour les projets  
export enum ProjetStatut {
  BROUILLON = 'brouillon',
  EN_COURS = 'en_cours',
  EN_ATTENTE = 'en_attente',
  TERMINE = 'termine',
  ANNULE = 'annule'
}

export enum DevisStatut {
  BROUILLON = 'brouillon',
  ENVOYE = 'envoye',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire'
}

export enum TypeDocument {
  DEVIS = 'devis',
  FACTURE = 'facture',
  BON_COMMANDE = 'bon_commande',
  PLAN = 'plan',
  PHOTO = 'photo',
  AUTRE = 'autre'
}

// Interfaces pour les filtres
export interface ProjetFilters {
  statut?: ProjetStatut;
  clientId?: string;
  dateDebut?: Date;
  dateFin?: Date;
}

export interface StockFilters {
  categorieId?: string;
  quantiteMin?: number;
  quantiteMax?: number;
  emplacement?: string;
}

// Types de stock
export interface Stock {
  id: string;
  produitId: string;
  quantite: number;
  quantiteReservee: number;
  quantiteDisponible: number;
  emplacement: string;
  dateModification: Date;
}

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  description?: string;
  categorieId: string;
  uniteId: string;
  prixUnitaire: number;
  stock?: Stock;
}

export interface MouvementStock {
  id: string;
  produitId: string;
  type: 'entree' | 'sortie' | 'transfert' | 'inventaire';
  quantite: number;
  motif: string;
  dateMovement: Date;
  utilisateurId: string;
}
