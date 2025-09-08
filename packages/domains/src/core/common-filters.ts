/**
 * 🏗️ FILTRES COMMUNS - DOMAINE CORE
 * Types de filtres partagés entre différents domaines
 */

import type { BaseFilters } from './base'

/**
 * Filtres pour les opérations générales
 */
export interface OperationFilters extends BaseFilters {
  readonly statut?: string | string[]
  readonly type?: string | string[]
  readonly priorite?: string | string[]
  readonly responsableId?: string
  readonly projetId?: string
  readonly clientId?: string
  readonly dateDebutMin?: Date
  readonly dateDebutMax?: Date
  readonly dateFinMin?: Date
  readonly dateFinMax?: Date
  readonly page?: number
  readonly limit?: number
  readonly sortBy?: 'dateDebut' | 'dateFin' | 'priorite' | 'statut' | 'type'
  readonly sortOrder?: 'asc' | 'desc'
}

/**
 * Filtres pour la facturation
 */
export interface FacturationFilters extends BaseFilters {
  readonly statut?: string | string[]
  readonly type?: string | string[]
  readonly clientId?: string
  readonly projetId?: string
  readonly numeroFacture?: string
  readonly montantMin?: number
  readonly montantMax?: number
  readonly dateEmissionMin?: Date
  readonly dateEmissionMax?: Date
  readonly dateEcheanceMin?: Date
  readonly dateEcheanceMax?: Date
  readonly payee?: boolean
  readonly enRetard?: boolean
  readonly page?: number
  readonly limit?: number
  readonly sortBy?: 'numero' | 'dateEmission' | 'dateEcheance' | 'montant' | 'statut'
  readonly sortOrder?: 'asc' | 'desc'
}
