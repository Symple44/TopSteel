import type { IBusinessRepository } from '../../core/interfaces/business-service.interface'
import type { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import type { PartnerSearchCriteria } from '../services/partner.service'

/**
 * Interface du repository pour les partenaires (clients/fournisseurs)
 */
export interface IPartnerRepository extends IBusinessRepository<Partner> {
  /**
   * Trouver un partenaire par son code
   */
  findByCode(code: string): Promise<Partner | null>

  /**
   * Trouver un partenaire par son SIRET
   */
  findBySiret(siret: string): Promise<Partner | null>

  /**
   * Trouver un partenaire par son email
   */
  findByEmail(email: string): Promise<Partner | null>

  /**
   * Trouver les partenaires par type et statut
   */
  findByTypeAndStatus(types: PartnerType[], status: PartnerStatus): Promise<Partner[]>

  /**
   * Compter les partenaires par type
   */
  countByType(type: PartnerType): Promise<number>

  /**
   * Rechercher les partenaires selon des critères
   */
  searchByCriteria(criteria: PartnerSearchCriteria): Promise<Partner[]>

  /**
   * Obtenir tous les partenaires
   */
  findAll(): Promise<Partner[]>

  /**
   * Vérifier si un partenaire a des commandes actives
   */
  hasActiveOrders(partnerId: string): Promise<boolean>

  /**
   * Vérifier si un partenaire a des factures impayées
   */
  hasUnpaidInvoices(partnerId: string): Promise<boolean>

  /**
   * Recherche avec pagination et filtres avancés
   */
  findWithFilters(filters: PartnerAdvancedFilters): Promise<{
    items: Partner[]
    total: number
    page: number
    limit: number
  }>

  /**
   * Obtenir les partenaires par ville
   */
  findByVille(ville: string): Promise<Partner[]>

  /**
   * Obtenir les partenaires par région (code postal)
   */
  findByRegion(codePostalPrefix: string): Promise<Partner[]>

  /**
   * Recherche textuelle dans les champs principaux
   */
  searchByText(searchText: string, limit?: number): Promise<Partner[]>

  /**
   * Obtenir les statistiques des partenaires
   */
  getPartnerStats(): Promise<PartnerRepositoryStats>

  /**
   * Obtenir les partenaires créés dans une période
   */
  findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Partner[]>

  /**
   * Obtenir les partenaires modifiés récemment
   */
  findRecentlyModified(nbJours: number): Promise<Partner[]>

  /**
   * Vérifier l'existence de doublons potentiels
   */
  findPotentialDuplicates(partner: Partner): Promise<Partner[]>

  /**
   * Obtenir les fournisseurs préférés
   */
  getFournisseursPreferences(): Promise<Partner[]>

  /**
   * Obtenir les clients avec un chiffre d'affaires élevé
   */
  getTopClients(limit: number): Promise<Array<Partner & { chiffreAffaires: number }>>
}

/**
 * Filtres avancés pour la recherche de partenaires
 */
export interface PartnerAdvancedFilters extends PartnerSearchCriteria {
  // Critères géographiques
  region?: string
  departement?: string
  pays?: string[]

  // Critères commerciaux
  chiffreAffairesMin?: number
  chiffreAffairesMax?: number
  dateCreationMin?: Date
  dateCreationMax?: Date
  ancienneteMin?: number // en années
  ancienneteMax?: number

  // Critères de recherche textuelle
  searchText?: string
  searchFields?: string[] // Champs dans lesquels chercher

  // Critères de tri
  sortBy?: PartnerSortField
  sortOrder?: 'ASC' | 'DESC'

  // Critères spéciaux
  hasOrders?: boolean
  hasUnpaidInvoices?: boolean
  isPreferredSupplier?: boolean
  hasContactEmail?: boolean
  hasContactPhone?: boolean
}

export enum PartnerSortField {
  CODE = 'code',
  DENOMINATION = 'denomination',
  TYPE = 'type',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VILLE = 'ville',
  CHIFFRE_AFFAIRES = 'chiffreAffaires',
}

/**
 * Statistiques du repository des partenaires
 */
export interface PartnerRepositoryStats {
  totalPartenaires: number
  repartitionParType: Record<PartnerType, number>
  repartitionParStatus: Record<PartnerStatus, number>
  repartitionParCategorie: Record<string, number>
  repartitionGeographique: {
    parVille: Record<string, number>
    parDepartement: Record<string, number>
    parRegion: Record<string, number>
  }
  tendanceCreation: Array<{
    periode: string // YYYY-MM
    nombreCreations: number
  }>
  moyenneAnciennete: number // en années
  tauxActivite: number // % de partenaires actifs
}
