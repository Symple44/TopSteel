/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE ORGANIZATION
 * Logique métier pure pour l'organisation
 */
import type { BaseEntity } from '../../base'
export declare enum DepartementType {
  PRODUCTION = 'PRODUCTION',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABILITE = 'COMPTABILITE',
  DIRECTION = 'DIRECTION',
  QUALITE = 'QUALITE',
  MAINTENANCE = 'MAINTENANCE',
  LOGISTIQUE = 'LOGISTIQUE',
}
export declare enum SiteType {
  SIEGE = 'SIEGE',
  ATELIER = 'ATELIER',
  DEPOT = 'DEPOT',
  BUREAU = 'BUREAU',
}
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
  readonly departements: string[]
  readonly createdAt: Date
  readonly updatedAt: Date
}
export interface Organization extends BaseEntity {
  readonly raisonSociale: string
  readonly nomCommercial?: string
  readonly legalInfo: LegalInfo
  readonly adresseSiege: OrganizationAddress
  readonly contact: OrganizationContact
  readonly sites: Site[]
  readonly departements: Departement[]
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
  readonly createdAt: Date
  readonly updatedAt: Date
}
export interface OrganizationStats {
  readonly effectifTotal: number
  readonly nombreSites: number
  readonly nombreDepartements: number
  readonly budgetTotal: number
  readonly performanceGlobale: number
}
//# sourceMappingURL=entities.d.ts.map
