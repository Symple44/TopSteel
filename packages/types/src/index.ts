// packages/types/src/index.ts
// Common types
export * from "./client";
export * from "./common";
export * from "./devis";
export * from "./forms";
export * from "./production";
export * from "./projet";
export * from "./stock";
export * from "./user";

// Type guards - imports corrects
import type { Client } from "./client";
import { ClientType } from "./client";
import type { Projet } from "./projet";
import { ProjetStatut } from "./projet";
import type { Stock } from "./stock";
import { StockType } from "./stock";

export function isProjet(obj: any): obj is Projet {
  return (
    obj &&
    typeof obj.reference === "string" &&
    Object.values(ProjetStatut).includes(obj.statut)
  );
}

export function isClient(obj: any): obj is Client {
  return (
    obj &&
    typeof obj.nom === "string" &&
    Object.values(ClientType).includes(obj.type)
  );
}

export function isStock(obj: any): obj is Stock {
  return (
    obj &&
    typeof obj.reference === "string" &&
    Object.values(StockType).includes(obj.type)
  );
}

// === TYPES POUR COMPATIBILITÉ CI ===
export interface CategorieProduit {
  id: string;
  nom: string;
  description?: string;
  couleur?: string;
}

export interface UniteMesure {
  id: string;
  nom: string;
  symbole: string;
  type: 'longueur' | 'poids' | 'volume' | 'surface' | 'quantite';
}

// Types d'authentification
export interface LoginResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// API Response type
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// === ENUMS MANQUANTS POUR LE CI (UNIQUES) ===
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

export enum TypeDocument {
  DEVIS = 'devis',
  FACTURE = 'facture',
  BON_COMMANDE = 'bon_commande',
  PLAN = 'plan',
  PHOTO = 'photo',
  AUTRE = 'autre'
}

// === CONSTANTES POUR USAGE COMME VALEURS ===
export const UNITES_MESURE = {
  PIECE: { id: 'piece', nom: 'Pièce', symbole: 'pc' },
  METRE: { id: 'm', nom: 'Mètre', symbole: 'm' },
  METRE_CARRE: { id: 'm2', nom: 'Mètre carré', symbole: 'm²' },
  KILOGRAMME: { id: 'kg', nom: 'Kilogramme', symbole: 'kg' },
  LITRE: { id: 'l', nom: 'Litre', symbole: 'l' }
} as const;

export const CATEGORIES_PRODUIT = {
  PROFILE: { id: 'profile', nom: 'Profilé', couleur: '#3B82F6' },
  TUBE: { id: 'tube', nom: 'Tube', couleur: '#10B981' },
  TOLE: { id: 'tole', nom: 'Tôle', couleur: '#F59E0B' },
  CONSOMMABLE: { id: 'consommable', nom: 'Consommable', couleur: '#EF4444' },
  ACCESSOIRE: { id: 'accessoire', nom: 'Accessoire', couleur: '#8B5CF6' },
  QUINCAILLERIE: { id: 'quincaillerie', nom: 'Quincaillerie', couleur: '#6B7280' }
} as const;

// === TYPES ÉTENDUS POUR COMPATIBILITÉ ===
export interface ProjetFilters {
  statut?: string
  clientId?: string
  dateDebut?: Date
  dateFin?: Date
}

export interface StockFilters {
  categorieId?: string
  quantiteMin?: number
  quantiteMax?: number
  emplacement?: string
}

export interface Produit {
  id: string
  nom: string
  reference: string
  description?: string
  categorieId: string
  uniteId: string
  prixUnitaire: number
}
