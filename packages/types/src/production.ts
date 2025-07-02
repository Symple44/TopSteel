// packages/types/src/production.ts
import type { BaseEntity } from './common'
import type { Projet } from './projet'
import type { User } from './user'

export enum OrdreStatut {
  PLANIFIE = 'planifie',
  EN_COURS = 'en_cours',
  PAUSE = 'pause',
  TERMINE = 'termine',
  ANNULE = 'annule'
}

export enum OrdrePriorite {
  BASSE = 'basse',
  NORMALE = 'normale',
  HAUTE = 'haute',
  URGENTE = 'urgente'
}

export enum OperationStatut {
  ATTENTE = 'attente',
  EN_COURS = 'en_cours',
  TERMINE = 'termine'
}

export interface OrdreFabrication extends BaseEntity {
  reference: string
  projetId: string
  projet: Projet
  statut: OrdreStatut
  priorite: OrdrePriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  avancement: number
  technicienId?: string
  technicien?: User
  machineId?: string
  machine?: Machine
  operations: Operation[]
  materiaux: MateriauRequis[]
  controles: ControleQualite[]
  tempsEstime: number
  tempsReel: number
  coutEstime: number
  coutReel: number
  notes?: string
}

export interface Operation extends BaseEntity {
  ordreId: string
  ordre: OrdreFabrication
  nom: string
  description?: string
  ordreExecution: number
  statut: OperationStatut
  tempsEstime?: number
  tempsReel?: number
  technicienId?: string
  technicien?: User
  machineId?: string
  machine?: Machine
  dateDebut?: Date
  dateFin?: Date
}

export interface Machine extends BaseEntity {
  nom: string
  type: string
  description?: string
  actif: boolean
  capacite?: number
  emplacement?: string
  dateLastMaintenance?: Date
  dateNextMaintenance?: Date
}

export interface MateriauRequis extends BaseEntity {
  ordreId: string
  materiauId: string
  materiau: {
    reference: string
    nom: string
    unite: string
  }
  quantiteRequise: number
  quantiteConsommee: number
  prixUnitaire: number
}

export interface ControleQualite extends BaseEntity {
  ordreId: string
  nom: string
  type: 'visuel' | 'dimensionnel' | 'fonctionnel'
  statut: 'attente' | 'conforme' | 'non_conforme'
  criteres: string[]
  resultats?: string
  dateControle?: Date
  operateurId?: string
  operateur?: User
}

// Requests
export interface CreateOrdreFabricationRequest {
  projetId: string
  priorite?: OrdrePriorite
  dateFinPrevue?: Date
  technicienId?: string
  machineId?: string
  operations: Omit<Operation, 'id' | 'ordreId' | 'createdAt' | 'updatedAt'>[]
  notes?: string
}

export interface UpdateOrdreFabricationRequest {
  statut?: OrdreStatut
  priorite?: OrdrePriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  avancement?: number
  technicienId?: string
  machineId?: string
  tempsReel?: number
  coutReel?: number
  notes?: string
}

export interface PlanningItem {
  ordreId: string
  ordre: OrdreFabrication
  dateDebut: Date
  dateFin: Date
  technicienId?: string
  machineId?: string
  couleur?: string
}

export interface OrdreFabricationStats {
  total: number
  enCours: number
  planifies: number
  termines: number
  enRetard: number
  tauxAvancement: number
  chargeMachine: number
}