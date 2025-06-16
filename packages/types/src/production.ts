// packages/types/src/production.ts
export enum OrdreFabricationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export interface OrdreFabrication extends BaseEntity {
  numero: string
  projetId: string
  projet: Projet
  description: string
  statut: OrdreFabricationStatut
  priorite: ProjetPriorite
  dateDebut: Date
  dateFin?: Date
  dateFinPrevue: Date
  tempsEstime: number // en heures
  tempsReel?: number // en heures
  avancement: number // en pourcentage
  machine?: string
  operateur?: User
  operateurId?: string
  materiaux: MaterialOrdreFabrication[]
  operations: OperationFabrication[]
  notes?: string
}

export interface MaterialOrdreFabrication {
  id: string
  stockId: string
  stock: Stock
  quantiteNecessaire: number
  quantiteUtilisee?: number
  quantiteReservee: number
}

export interface OperationFabrication extends BaseEntity {
  ordreId: string
  ordre: OrdreFabrication
  nom: string
  description?: string
  dureeEstimee: number // en minutes
  dureeReelle?: number // en minutes
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'PAUSE'
  operateurId?: string
  operateur?: User
  machineId?: string
  dateDebut?: Date
  dateFin?: Date
  ordre_execution: number
}