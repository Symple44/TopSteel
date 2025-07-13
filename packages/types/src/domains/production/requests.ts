/**
 * 🏭 PRODUCTION REQUESTS - TopSteel ERP
 * Types de requêtes pour le domaine production
 */

import type { DeepPartial, WithoutId } from '../../core'
import type { ListRequest } from '../../infrastructure/api'
import type { Operation, OperationFilters, OrdreFabrication, ProductionFilters } from './entities'
import type { OrdrePriorite, TypeOperation } from './enums'

/**
 * Requête de création d'un ordre de fabrication
 */
export interface CreateOrdreFabricationRequest {
  numero?: string
  description: string
  projetId: string
  priorite?: OrdrePriorite
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  tempsPrevu?: number
  coutPrevu?: number
  responsableId?: string
  notes?: string
}

/**
 * Requête de mise à jour d'un ordre de fabrication
 */
export interface UpdateOrdreFabricationRequest {
  description?: string
  priorite?: OrdrePriorite
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  tempsPrevu?: number
  coutPrevu?: number
  responsableId?: string
  notes?: string
  avancement?: number
}

/**
 * Requête de création complète d'un ordre de fabrication
 */
export type CreateFullOrdreFabricationRequest = WithoutId<OrdreFabrication>

/**
 * Requête de mise à jour complète d'un ordre de fabrication
 */
export type UpdateFullOrdreFabricationRequest = DeepPartial<WithoutId<OrdreFabrication>>

/**
 * Requête de création d'une opération
 */
export interface CreateOperationRequest {
  nom: string
  description?: string
  type: TypeOperation
  ordreFabricationId: string
  ordre: number
  machineId?: string
  technicienId?: string
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  dureeEstimee: number
  coutHoraire?: number
  outilsRequis?: string[]
  competencesRequises?: string[]
  instructions?: string
  controleRequis?: boolean
}

/**
 * Requête de mise à jour d'une opération
 */
export interface UpdateOperationRequest {
  nom?: string
  description?: string
  machineId?: string
  technicienId?: string
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  dureeEstimee?: number
  coutHoraire?: number
  outilsRequis?: string[]
  competencesRequises?: string[]
  instructions?: string
  controleRequis?: boolean
}

/**
 * Requête de liste des ordres de fabrication avec filtres
 */
export interface ListProductionRequest extends ListRequest {
  filters?: ProductionFilters
}

/**
 * Requête de liste des opérations avec filtres
 */
export interface ListOperationsRequest extends ListRequest {
  filters?: OperationFilters
}

/**
 * Requête pour démarrer un ordre de fabrication
 */
export interface StartOrdreFabricationRequest {
  ordreFabricationId: string
  dateDebutReelle?: Date
  responsableId?: string
  notes?: string
}

/**
 * Requête pour terminer un ordre de fabrication
 */
export interface CompleteOrdreFabricationRequest {
  ordreFabricationId: string
  dateFinReelle?: Date
  tempsReel?: number
  coutReel?: number
  notes?: string
}

/**
 * Requête pour planifier une opération
 */
export interface ScheduleOperationRequest {
  operationId: string
  machineId?: string
  technicienId?: string
  dateDebut: Date
  dateFin: Date
}

/**
 * Requête pour obtenir les statistiques de production
 */
export interface ProductionStatsRequest {
  dateDebut?: Date
  dateFin?: Date
  groupBy?: 'jour' | 'semaine' | 'mois' | 'machine' | 'technicien' | 'projet'
  projetId?: string
  machineId?: string
  technicienId?: string
}

/**
 * Requête pour le planning de production
 */
export interface ProductionPlanningRequest {
  dateDebut: Date
  dateFin: Date
  machineId?: string
  technicienId?: string
  includeMaintenances?: boolean
}

/**
 * Requête d'ajout de matériau à un ordre
 */
export interface AddMaterialRequest {
  ordreFabricationId: string
  reference: string
  nom: string
  quantiteRequise: number
  unite: string
  prixUnitaire?: number
  fournisseurId?: string
  operationId?: string
}
