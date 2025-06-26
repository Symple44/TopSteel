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
// Types sûrs (pas de conflit)
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
  user: User;
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

export * from './additional';
