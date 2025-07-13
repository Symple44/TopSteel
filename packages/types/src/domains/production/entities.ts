/**
 * 🏭 PRODUCTION ENTITIES - TopSteel ERP
 * Entités et interfaces pour le domaine production
 */

import type { BaseEntity } from '../../core'
import type { 
  OrdreStatut, 
  OrdrePriorite, 
  OperationStatut, 
  TypeOperation, 
  QualiteStatut,
  MaterialStatus,
  TypeMachine
} from './enums'

/**
 * Ordre de fabrication principal
 */
export interface OrdreFabrication extends BaseEntity {
  numero: string
  description: string
  projetId: string
  statut: OrdreStatut
  priorite: OrdrePriorite
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  dateDebutReelle?: Date
  dateFinReelle?: Date
  avancement: number
  tempsPrevu: number // en minutes
  tempsReel: number // en minutes
  coutPrevu: number
  coutReel: number
  responsableId?: string
  operationsIds: string[]
  materiauxIds: string[]
  controlesIds: string[]
  notes?: string
}

/**
 * Opération de fabrication
 */
export interface Operation extends BaseEntity {
  nom: string
  description?: string
  type: TypeOperation
  statut: OperationStatut
  ordreFabricationId: string
  ordre: number // ordre d'exécution
  machineId?: string
  technicienId?: string
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  dateDebutReelle?: Date
  dateFinReelle?: Date
  dureeEstimee: number // en minutes
  dureeReelle?: number // en minutes
  coutHoraire?: number
  outilsRequis?: string[]
  competencesRequises?: string[]
  instructions?: string
  ficheTravail?: string
  controleRequis: boolean
}

/**
 * Matériau requis pour production
 */
export interface MaterialOrder extends BaseEntity {
  reference: string
  nom: string
  description?: string
  quantiteRequise: number
  quantiteRecue?: number
  quantiteUtilisee?: number
  unite: string
  prixUnitaire?: number
  fournisseurId?: string
  statut: MaterialStatus
  ordreFabricationId: string
  operationId?: string
  dateCommandePrevue?: Date
  dateReceptionPrevue?: Date
  dateReceptionReelle?: Date
}

/**
 * Contrôle qualité
 */
export interface ControleQualite extends BaseEntity {
  nom: string
  description?: string
  type: 'ENTRANT' | 'PROCESSUS' | 'SORTANT'
  statut: QualiteStatut
  ordreFabricationId: string
  operationId?: string
  technicienId?: string
  dateControle?: Date
  criteres: ControleQualiteCritere[]
  photos?: string[]
  certificats?: string[]
  remarques?: string
  actionCorrective?: string
}

/**
 * Critère de contrôle qualité
 */
export interface ControleQualiteCritere {
  id: string
  nom: string
  valeurAttendue: string | number
  valeurMesuree?: string | number
  unite?: string
  tolerance?: number
  conforme: boolean
  remarque?: string
}

/**
 * Machine/équipement
 */
export interface Machine extends BaseEntity {
  nom: string
  reference: string
  type: TypeMachine
  statut: 'DISPONIBLE' | 'OCCUPEE' | 'MAINTENANCE' | 'PANNE'
  capaciteHoraire?: number
  coutHoraire?: number
  competencesRequises?: string[]
  prochaineMaintenancePrevue?: Date
  derniereMaintenanceReelle?: Date
  notes?: string
}

/**
 * Item de planning
 */
export interface PlanningItem {
  id: string
  ordreFabricationId: string
  operationId?: string
  machineId?: string
  technicienId?: string
  dateDebut: Date
  dateFin: Date
  type: 'PRODUCTION' | 'MAINTENANCE' | 'FORMATION'
}

/**
 * Conflit de planning
 */
export interface PlanningConflit {
  id: string
  type: 'MACHINE_OCCUPEE' | 'TECHNICIEN_OCCUPE' | 'RESSOURCE_INDISPONIBLE'
  description: string
  dateDebut: Date
  dateFin: Date
  ressourceId: string
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE'
  resolu: boolean
  solution?: string
}

/**
 * Filtres pour les ordres de fabrication
 */
export interface ProductionFilters {
  statut?: OrdreStatut[]
  priorite?: OrdrePriorite[]
  projetId?: string
  responsableId?: string
  machineId?: string
  dateDebutMin?: Date
  dateDebutMax?: Date
  dateFinMin?: Date
  dateFinMax?: Date
  avancementMin?: number
  avancementMax?: number
  search?: string
}

/**
 * Filtres pour les opérations
 */
export interface OperationFilters {
  statut?: OperationStatut[]
  type?: TypeOperation[]
  ordreFabricationId?: string
  machineId?: string
  technicienId?: string
  dateMin?: Date
  dateMax?: Date
  search?: string
}