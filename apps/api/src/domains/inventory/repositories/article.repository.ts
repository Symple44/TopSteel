import type { IBusinessRepository } from '../../core/interfaces/business-service.interface'
import type { Article, ArticleStatus, ArticleType } from '../entities/article.entity'
import type { ArticleSearchCriteria, ArticleStatistics } from '../services/article.service'

/**
 * Interface du repository pour les articles
 */
export interface IArticleRepository extends IBusinessRepository<Article> {
  /**
   * Trouver un article par sa référence
   */
  findByReference(reference: string): Promise<Article | null>

  /**
   * Trouver un article par son code EAN
   */
  findByCodeEAN(codeEAN: string): Promise<Article | null>

  /**
   * Trouver les articles par type
   */
  findByType(type: ArticleType): Promise<Article[]>

  /**
   * Trouver les articles par statut
   */
  findByStatus(status: ArticleStatus): Promise<Article[]>

  /**
   * Trouver les articles par famille
   */
  findByFamille(famille: string): Promise<Article[]>

  /**
   * Trouver les articles par fournisseur principal
   */
  findByFournisseur(fournisseurId: string): Promise<Article[]>

  /**
   * Compter les articles par type
   */
  countByType(type: ArticleType): Promise<number>

  /**
   * Rechercher les articles selon des critères
   */
  searchByCriteria(criteria: ArticleSearchCriteria): Promise<Article[]>

  /**
   * Trouver les articles selon une condition de stock
   */
  findByStockCondition(
    condition: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  ): Promise<Article[]>

  /**
   * Vérifier si un article a des mouvements de stock
   */
  hasStockMovements(articleId: string): Promise<boolean>

  /**
   * Obtenir tous les articles
   */
  findAll(): Promise<Article[]>

  /**
   * Recherche avec pagination et filtres avancés
   */
  findWithFilters(filters: ArticleAdvancedFilters): Promise<{
    items: Article[]
    total: number
    page: number
    limit: number
  }>

  /**
   * Recherche textuelle dans les champs principaux
   */
  searchByText(searchText: string, limit?: number): Promise<Article[]>

  /**
   * Obtenir les statistiques des articles
   */
  getArticleStats(): Promise<ArticleStatistics>

  /**
   * Obtenir les articles créés dans une période
   */
  findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Article[]>

  /**
   * Obtenir les articles modifiés récemment
   */
  findRecentlyModified(nbJours: number): Promise<Article[]>

  /**
   * Obtenir les articles par caractéristiques physiques
   */
  findByDimensions(
    longueurMin?: number,
    longueurMax?: number,
    largeurMin?: number,
    largeurMax?: number
  ): Promise<Article[]>

  /**
   * Obtenir les articles par gamme de prix
   */
  findByPriceRange(
    prixMin?: number,
    prixMax?: number,
    typePrix?: 'achat' | 'vente'
  ): Promise<Article[]>

  /**
   * Obtenir les articles nécessitant un stockage spécial
   */
  findRequiringSpecialStorage(): Promise<Article[]>

  /**
   * Obtenir les articles dangereux
   */
  findHazardousArticles(): Promise<Article[]>

  /**
   * Obtenir les articles avec des certifications spécifiques
   */
  findByCertifications(certifications: string[]): Promise<Article[]>

  /**
   * Obtenir les articles par délai d'approvisionnement
   */
  findBySupplyDelay(delaiMax: number): Promise<Article[]> // délai en jours

  /**
   * Obtenir la valorisation du stock par famille
   */
  getStockValuationByFamily(): Promise<Record<string, { quantite: number; valeur: number }>>

  /**
   * Obtenir les mouvements de stock récents pour un article
   */
  getRecentStockMovements(articleId: string, limit: number): Promise<any[]>

  /**
   * Obtenir les articles les plus vendus
   */
  getBestSellers(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Article & { quantiteVendue: number }>>

  /**
   * Obtenir les articles à rotation lente
   */
  getSlowMovingArticles(nbJoursSansVente: number): Promise<Article[]>
}

/**
 * Filtres avancés pour la recherche d'articles
 */
export interface ArticleAdvancedFilters extends ArticleSearchCriteria {
  // Critères de stock
  stockMin?: number
  stockMax?: number
  stockDisponibleMin?: number
  stockDisponibleMax?: number
  avecStock?: boolean
  sansStock?: boolean

  // Critères de prix
  prixAchatMin?: number
  prixAchatMax?: number
  prixVenteMin?: number
  prixVenteMax?: number
  margeMin?: number
  margeMax?: number

  // Critères physiques
  poidsMin?: number
  poidsMax?: number
  volumeMin?: number
  volumeMax?: number

  // Critères de dates
  dateCreationMin?: Date
  dateCreationMax?: Date
  dateDernierMouvementMin?: Date
  dateDernierMouvementMax?: Date
  dateDernierInventaireMin?: Date
  dateDernierInventaireMax?: Date

  // Critères spéciaux
  stockageSpecial?: boolean
  dangereux?: boolean
  obsolete?: boolean
  enRupture?: boolean
  sousStockMini?: boolean
  fournisseurPrefere?: boolean

  // Critères de recherche textuelle
  searchText?: string
  searchFields?: ArticleSearchField[]

  // Critères de tri
  sortBy?: ArticleSortField
  sortOrder?: 'ASC' | 'DESC'

  // Critères d'inclusion
  includeInactive?: boolean
  includeObsolete?: boolean
}

export enum ArticleSearchField {
  REFERENCE = 'reference',
  DESIGNATION = 'designation',
  DESCRIPTION = 'description',
  MARQUE = 'marque',
  MODELE = 'modele',
  CODE_EAN = 'codeEAN',
  REFERENCE_FOURNISSEUR = 'referenceFournisseur',
}

export enum ArticleSortField {
  REFERENCE = 'reference',
  DESIGNATION = 'designation',
  TYPE = 'type',
  FAMILLE = 'famille',
  STOCK_PHYSIQUE = 'stockPhysique',
  STOCK_DISPONIBLE = 'stockDisponible',
  PRIX_ACHAT = 'prixAchatMoyen',
  PRIX_VENTE = 'prixVenteHT',
  VALEUR_STOCK = 'valeurStock',
  DATE_CREATION = 'dateCreationFiche',
  DATE_DERNIER_MOUVEMENT = 'dateDernierMouvement',
  DATE_DERNIER_INVENTAIRE = 'dateDernierInventaire',
}

/**
 * Résultat de recherche avec métadonnées
 */
export interface ArticleSearchResult {
  items: Article[]
  total: number
  page: number
  limit: number
  filters: ArticleAdvancedFilters
  aggregations?: {
    parType: Record<ArticleType, number>
    parFamille: Record<string, number>
    parStatus: Record<ArticleStatus, number>
    stockTotal: number
    valeurTotale: number
  }
}

/**
 * Interface pour les alertes de stock
 */
export interface StockAlert {
  articleId: string
  reference: string
  designation: string
  type: 'RUPTURE' | 'SOUS_STOCK_MINI' | 'SURSTOCKAGE' | 'PEREMPTION'
  niveau: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  stockActuel: number
  stockMini?: number
  stockMaxi?: number
  quantiteACommander?: number
  delaiApprovisionnement?: string
  dateAlerte: Date
}
