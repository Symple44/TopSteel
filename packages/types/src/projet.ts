// packages/types/src/projet.ts - Extensions des types existants
import type { Client } from './client'
import type { Address, BaseEntity } from './common'
import type { Devis } from './facturation'
import type { User } from './user'

// ===== ENUM EXISTANTS (inchangés) =====

export enum ProjetStatut {
  BROUILLON = 'brouillon',
  DEVIS = 'devis',
  EN_ATTENTE = 'en_attente',
  ACCEPTE = 'accepte',
  EN_COURS = 'en_cours',
  EN_PAUSE = 'en_pause',
  TERMINE = 'termine',
  ANNULE = 'annule',
  FACTURE = 'facture'
}

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
  AUTRE = 'AUTRE'
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

// ===== INTERFACES EXISTANTES (inchangées) =====

export interface DocumentProjet {
  id: string
  nom: string
  type: 'pdf' | 'image' | 'document' | 'plan'
  url: string
  dateAjout: Date
  taille: number
  description?: string
}

/**
 * Interface Projet - conserve exactement l'interface existante
 */
export interface Projet extends BaseEntity {
  reference: string
  description: string
  client: Client
  clientId: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  dateCreation: Date
  adresseChantier: Address
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  avancement: number
  notes?: string
  alertes?: string[]
  responsable?: User
  responsableId?: string
  devis?: Devis
  documents?: DocumentProjet[]
  documentsIds: string[]
  ordresFabricationIds: string[]
}

// ===== INTERFACES DE REQUÊTE (compatibles avec l'existant) =====

export interface CreateProjetRequest {
  nom: string;
  description?: string;
  clientId?: string;
  budget?: number;
  responsable?: string;
  echeance?: Date;
  priorite?: ProjetPriorite;
}

export interface UpdateProjetRequest {
  nom?: string;
  description?: string;
  statut?: ProjetStatut;
  budget?: number;
  progression?: number;
  responsable?: string;
  echeance?: Date;
  priorite?: ProjetPriorite;
  commentaires?: string;
}

// ===== HELPERS ET UTILITAIRES (nouveaux) =====

/**
 * Valide un statut de projet
 */
export function isValidProjetStatut(statut: unknown): statut is ProjetStatut {
  return Object.values(ProjetStatut).includes(statut as ProjetStatut)
}

/**
 * Valide un type de projet
 */
export function isValidProjetType(type: unknown): type is ProjetType {
  return Object.values(ProjetType).includes(type as ProjetType)
}

/**
 * Valide une priorité de projet
 */
export function isValidProjetPriorite(priorite: unknown): priorite is ProjetPriorite {
  return Object.values(ProjetPriorite).includes(priorite as ProjetPriorite)
}

// ===== CONSTANTES MÉTIER (nouvelles) =====

/** Statuts indiquant un projet actif */
export const STATUTS_ACTIFS: ProjetStatut[] = [
  ProjetStatut.EN_ATTENTE,
  ProjetStatut.ACCEPTE, 
  ProjetStatut.EN_COURS
] as const

/** Statuts indiquant un projet terminé */
export const STATUTS_TERMINES: ProjetStatut[] = [
  ProjetStatut.TERMINE,
  ProjetStatut.FACTURE,
  ProjetStatut.ANNULE
] as const

/** Priorités par ordre d'urgence */
export const PRIORITES_ORDRE: ProjetPriorite[] = [
  ProjetPriorite.URGENTE,
  ProjetPriorite.HAUTE,
  ProjetPriorite.NORMALE, 
  ProjetPriorite.BASSE
] as const