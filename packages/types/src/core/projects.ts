/**
 * 📋 PROJECTS - TopSteel ERP
 * Types pour la gestion des projets
 */

import type { BaseEntity } from './base'

/**
 * Types de projets
 */
export enum ProjectType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  MAINTENANCE = 'MAINTENANCE',
  CONCEPTION = 'CONCEPTION',
  FABRICATION = 'FABRICATION',
  INSTALLATION = 'INSTALLATION',
}

/**
 * Statuts des projets
 */
export enum ProjectStatus {
  BROUILLON = 'BROUILLON',
  DEVIS = 'DEVIS',
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  FACTURE = 'FACTURE',
  ANNULE = 'ANNULE',
}

/**
 * Priorités des projets
 */
export enum ProjectPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

/**
 * Interface principale pour les projets
 */
export interface Project extends BaseEntity {
  nom: string
  reference: string
  description?: string
  type: ProjectType
  statut: ProjectStatus
  priorite: ProjectPriority

  // Dates
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  dateFinReelle?: Date

  // Client
  clientId: string
  client?: {
    id: string
    nom: string
    email: string
    type: string
  }

  // Financier
  montantHT?: number
  montantTTC?: number
  tauxTVA?: number
  marge?: number

  // Avancement
  avancement?: number // Pourcentage 0-100

  // Métadonnées
  metadata?: Record<string, unknown>
}

/**
 * Alias pour compatibilité avec le système existant
 */
export interface Projet extends Project {}

/**
 * Filtres pour les projets
 */
export interface ProjectFilters {
  page?: number
  limit?: number
  search?: string
  type?: ProjectType
  statut?: ProjectStatus
  priorite?: ProjectPriority
  clientId?: string
  dateDebutFrom?: Date
  dateDebutTo?: Date
  dateFinFrom?: Date
  dateFinTo?: Date
  avancementMin?: number
  avancementMax?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Statistiques des projets
 */
export interface ProjectStatistics {
  totalProjets: number
  repartitionParType: Record<ProjectType, number>
  repartitionParStatut: Record<ProjectStatus, number>
  repartitionParPriorite: Record<ProjectPriority, number>
  chiffreAffaires: {
    total: number
    facture: number
    enCours: number
  }
  avancementMoyen: number
  retards: number
}

/**
 * DTO pour créer un projet
 */
export interface CreateProjectDto {
  nom: string
  reference?: string
  description?: string
  type: ProjectType
  statut?: ProjectStatus
  priorite?: ProjectPriority
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  clientId: string
  montantHT?: number
  montantTTC?: number
  tauxTVA?: number
  marge?: number
  avancement?: number
  metadata?: Record<string, unknown>
}

/**
 * DTO pour mettre à jour un projet
 */
export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  id: string
}
