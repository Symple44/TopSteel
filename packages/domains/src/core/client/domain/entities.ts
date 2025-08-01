/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE CLIENT
 * Logique métier pure pour les clients
 */

import type { BaseEntity } from '../../base'

// ===== VALUE OBJECTS =====

export interface ClientContact {
  readonly nom: string
  readonly telephone: string
  readonly email: string
  readonly poste?: string
}

export interface ClientAddress {
  readonly rue: string
  readonly ville: string
  readonly codePostal: string
  readonly pays: string
  readonly complement?: string
}

// ===== ENUMS MÉTIER =====

export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE',
}

export enum ClientStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  ARCHIVE = 'ARCHIVE',
}

export enum ClientPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  VIP = 'VIP',
}

// ===== ENTITÉ PRINCIPALE =====

export interface Client extends BaseEntity {
  // Identité
  readonly nom: string
  readonly type: ClientType
  readonly siret?: string

  // Contact
  readonly email: string
  readonly telephone: string
  readonly contact: ClientContact
  readonly adresse: ClientAddress

  // Business
  readonly statut: ClientStatut
  readonly priorite: ClientPriorite
  readonly source?: string
  readonly notes?: string

  // Métriques
  readonly chiffreAffaire?: number
  readonly nombreProjets?: number
  readonly dateDernierProjet?: Date

  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ===== AGRÉGATS =====

export interface ClientStats {
  readonly total: number
  readonly actifs: number
  readonly nouveauxCeMois: number
  readonly chiffreAffaireMoyen: number
  readonly topClients: Client[]
}

export interface ClientWithProjects extends Client {
  readonly projets: {
    total: number
    enCours: number
    termines: number
    chiffreAffaireTotal: number
  }
}
