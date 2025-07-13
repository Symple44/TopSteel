/**
 * 🏗️ PROJECT REQUESTS - TopSteel ERP
 * Types de requêtes pour le domaine projet
 */

import type { DeepPartial, WithoutId } from '../../core'
import type { ListRequest } from '../../infrastructure/api'
import type { Projet, ProjetFilters } from './entities'
import type { ProjetPriorite, ProjetStatut } from './enums'

/**
 * Requête de création d'un projet
 */
export interface CreateProjetRequest {
  nom: string
  description?: string
  clientId?: string
  budget?: number
  responsable?: string
  echeance?: Date
  priorite?: ProjetPriorite
}

/**
 * Requête de mise à jour d'un projet
 */
export interface UpdateProjetRequest {
  nom?: string
  description?: string
  statut?: ProjetStatut
  budget?: number
  progression?: number
  responsable?: string
  echeance?: Date
  priorite?: ProjetPriorite
  commentaires?: string
}

/**
 * Requête de création complète d'un projet
 */
export type CreateFullProjetRequest = WithoutId<Projet>

/**
 * Requête de mise à jour complète d'un projet
 */
export type UpdateFullProjetRequest = DeepPartial<WithoutId<Projet>>

/**
 * Requête de liste des projets avec filtres
 */
export interface ListProjetsRequest extends ListRequest {
  filters?: ProjetFilters
}

/**
 * Requête de recherche de projets
 */
export interface SearchProjetsRequest {
  query: string
  filters?: Partial<ProjetFilters>
  limit?: number
}

/**
 * Requête pour obtenir les statistiques de projets
 */
export interface ProjetStatsRequest {
  dateDebut?: Date
  dateFin?: Date
  groupBy?: 'statut' | 'type' | 'responsable' | 'client' | 'month'
  clientId?: string
  responsableId?: string
}

/**
 * Requête pour le planning des projets
 */
export interface ProjetPlanningRequest {
  dateDebut: Date
  dateFin: Date
  statuts?: ProjetStatut[]
  responsableId?: string
  clientId?: string
}

/**
 * Requête d'ajout de document à un projet
 */
export interface AddDocumentProjetRequest {
  projetId: string
  nom: string
  type: string
  fichier: File | Blob
  description?: string
}
