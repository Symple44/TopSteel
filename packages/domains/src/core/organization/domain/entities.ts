/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE ORGANIZATION
 * Logique métier pure pour l'organisation
 */

import type { BaseEntity } from '../../base'

// ===== ENUMS MÉTIER =====

export enum DepartementType {
  PRODUCTION = 'PRODUCTION',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABILITE = 'COMPTABILITE',
  DIRECTION = 'DIRECTION',
  QUALITE = 'QUALITE',
  MAINTENANCE = 'MAINTENANCE',
  LOGISTIQUE = 'LOGISTIQUE',
}

export enum SiteType {
  SIEGE = 'SIEGE',
  ATELIER = 'ATELIER',
  DEPOT = 'DEPOT',
  BUREAU = 'BUREAU',
}

// ===== VALUE OBJECTS =====

export interface OrganizationAddress {
  readonly rue: string
  readonly ville: string
  readonly codePostal: string
  readonly pays: string
  readonly region?: string
}

export interface OrganizationContact {
  readonly email: string
  readonly telephone: string
  readonly fax?: string
  readonly website?: string
}

export interface LegalInfo {
  readonly siret: string
  readonly siren: string
  readonly numeroTVA: string
  readonly codeAPE: string
  readonly formeJuridique: string
  readonly capitalSocial?: number
}

// ===== ENTITÉS =====

export interface Departement extends BaseEntity {
  readonly nom: string
  readonly type: DepartementType
  readonly description?: string
  readonly responsableId?: string
  readonly budget?: number
  readonly effectif: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Site extends BaseEntity {
  readonly nom: string
  readonly type: SiteType
  readonly adresse: OrganizationAddress
  readonly contact?: OrganizationContact
  readonly surface?: number
  readonly capacity?: number
  readonly actif: boolean
  readonly departements: string[] // IDs des départements
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Organization extends BaseEntity {
  // Identité légale
  readonly raisonSociale: string
  readonly nomCommercial?: string
  readonly legalInfo: LegalInfo
  
  // Contact principal
  readonly adresseSiege: OrganizationAddress
  readonly contact: OrganizationContact
  
  // Structure
  readonly sites: Site[]
  readonly departements: Departement[]
  
  // Configuration
  readonly settings: {
    timezone: string
    currency: string
    dateFormat: string
    workingHours: {
      start: string
      end: string
      daysPerWeek: number
    }
  }
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ===== AGRÉGATS =====

export interface OrganizationStats {
  readonly effectifTotal: number
  readonly nombreSites: number
  readonly nombreDepartements: number
  readonly budgetTotal: number
  readonly performanceGlobale: number
}