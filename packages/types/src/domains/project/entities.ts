/**
 * 🏗️ PROJECT ENTITIES - TopSteel ERP
 * Entités et interfaces pour le domaine projet
 */

import type { BaseEntity, Address } from '../../core'
import type { ProjetStatut, ProjetType, ProjetPriorite, DocumentType } from './enums'

/**
 * Document attaché à un projet
 */
export interface DocumentProjet {
  id: string
  nom: string
  type: DocumentType
  url: string
  dateAjout: Date
  taille: number
  description?: string
}

/**
 * Entité Projet principale
 */
export interface Projet extends BaseEntity {
  reference: string
  description: string
  clientId: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  adresseChantier: Address
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  avancement: number
  notes?: string
  alertes?: string[]
  responsableId?: string
  documentsIds: string[]
  ordresFabricationIds: string[]
}

/**
 * Projet pour affichage dans les listes (optimisé)
 */
export interface ProjetListItem {
  id: string
  reference: string
  description: string
  clientId: string
  clientNom?: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateFinPrevue?: Date
  montantHT: number
  avancement: number
  responsableId?: string
  responsableNom?: string
}

/**
 * Détails financiers d'un projet
 */
export interface ProjetFinances {
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  margePercentage: number
  coutMateriau?: number
  coutMainOeuvre?: number
  coutSousTraitance?: number
}

/**
 * Planning d'un projet
 */
export interface ProjetPlanning {
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  dureeEstimee?: number // en jours
  dureeReelle?: number // en jours
  jalons?: ProjetJalon[]
}

/**
 * Jalon de projet
 */
export interface ProjetJalon {
  id: string
  nom: string
  description?: string
  datePrevue: Date
  dateReelle?: Date
  statut: 'en_attente' | 'en_cours' | 'termine' | 'retard'
  responsableId?: string
}

/**
 * Filtres pour la recherche de projets
 */
export interface ProjetFilters {
  statut?: ProjetStatut[]
  type?: ProjetType[]
  priorite?: ProjetPriorite[]
  clientId?: string
  responsableId?: string
  dateDebutMin?: Date
  dateDebutMax?: Date
  dateFinMin?: Date
  dateFinMax?: Date
  montantMin?: number
  montantMax?: number
  avancementMin?: number
  avancementMax?: number
  search?: string
}