import { Column, Entity, Index } from 'typeorm'
import { BusinessEntity } from '../base/business-entity'

export enum ArticleType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  PRODUIT_SEMI_FINI = 'PRODUIT_SEMI_FINI',
  FOURNITURE = 'FOURNITURE',
  CONSOMMABLE = 'CONSOMMABLE',
  SERVICE = 'SERVICE'
}

export enum ArticleStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_COURS_CREATION = 'EN_COURS_CREATION'
}

export enum UniteStock {
  PIECE = 'PCS',
  KILOGRAMME = 'KG',
  GRAMME = 'G',
  METRE = 'M',
  CENTIMETRE = 'CM',
  MILLIMETRE = 'MM',
  METRE_CARRE = 'M2',
  METRE_CUBE = 'M3',
  LITRE = 'L',
  MILLILITRE = 'ML',
  TONNE = 'T',
  HEURE = 'H'
}

export enum MethodeValorisationStock {
  FIFO = 'FIFO', // Premier entré, premier sorti
  LIFO = 'LIFO', // Dernier entré, premier sorti
  CMUP = 'CMUP', // Coût moyen unitaire pondéré
  PRIX_STANDARD = 'PRIX_STANDARD'
}

/**
 * Entité métier : Article
 * Représente un article en stock (matière première, produit fini, etc.)
 */
@Entity('articles')
export class Article extends BusinessEntity {
  @Column({ type: 'varchar', length: 30, unique: true })
  @Index()
  reference!: string // Référence unique : ART-001, MP-001, etc.

  @Column({ type: 'varchar', length: 255 })
  @Index()
  designation!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: ArticleType })
  @Index()
  type!: ArticleType

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.ACTIF })
  @Index()
  status!: ArticleStatus

  // Classification
  @Column({ name: 'famille', type: 'varchar', length: 50, nullable: true })
  @Index()
  famille?: string // Famille d'articles

  @Column({ name: 'sous_famille', type: 'varchar', length: 50, nullable: true })
  @Index()
  sousFamille?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  modele?: string

  // Unités et gestion stock
  @Column({ name: 'unite_stock', type: 'enum', enum: UniteStock, default: UniteStock.PIECE })
  uniteStock!: UniteStock

  @Column({ name: 'unite_achat', type: 'enum', enum: UniteStock, nullable: true })
  uniteAchat?: UniteStock // Si différente de l'unité stock

  @Column({ name: 'unite_vente', type: 'enum', enum: UniteStock, nullable: true })
  uniteVente?: UniteStock // Si différente de l'unité stock

  @Column({ name: 'coefficient_achat', type: 'decimal', precision: 10, scale: 4, default: 1 })
  coefficientAchat?: number // Conversion unité achat -> unité stock

  @Column({ name: 'coefficient_vente', type: 'decimal', precision: 10, scale: 4, default: 1 })
  coefficientVente?: number // Conversion unité stock -> unité vente

  // Gestion des stocks
  @Column({ name: 'gere_en_stock', type: 'boolean', default: true })
  @Index()
  gereEnStock!: boolean

  @Column({ name: 'stock_physique', type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockPhysique?: number

  @Column({ name: 'stock_reserve', type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockReserve?: number // Stock réservé (commandes)

  @Column({ name: 'stock_disponible', type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockDisponible?: number // Stock physique - stock réservé

  @Column({ name: 'stock_mini', type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockMini?: number // Seuil de réapprovisionnement

  @Column({ name: 'stock_maxi', type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockMaxi?: number // Stock maximum

  @Column({ name: 'stock_securite', type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockSecurite?: number // Stock de sécurité

  // Valorisation
  @Column({ name: 'methode_valorisation', type: 'enum', enum: MethodeValorisationStock, default: MethodeValorisationStock.CMUP })
  methodeValorisation!: MethodeValorisationStock

  @Column({ name: 'prix_achat_standard', type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixAchatStandard?: number

  @Column({ name: 'prix_achat_moyen', type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixAchatMoyen?: number // CMUP

  @Column({ name: 'prix_vente_ht', type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixVenteHT?: number

  @Column({ name: 'taux_tva', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxTVA?: number // Taux de TVA en %

  @Column({ name: 'taux_marge', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxMarge?: number // Marge en %

  // Informations fournisseur principal
  @Column({ name: 'fournisseur_principal_id', type: 'uuid', nullable: true })
  @Index()
  fournisseurPrincipalId?: string

  @Column({ name: 'reference_fournisseur', type: 'varchar', length: 50, nullable: true })
  referenceFournisseur?: string

  @Column({ name: 'delai_approvisionnement', type: 'varchar', length: 10, nullable: true })
  delaiApprovisionnement?: string // Ex: "5J", "2S"

  @Column({ name: 'quantite_mini_commande', type: 'decimal', precision: 15, scale: 4, nullable: true })
  quantiteMiniCommande?: number

  @Column({ name: 'quantite_multiple_commande', type: 'decimal', precision: 15, scale: 4, nullable: true })
  quantiteMultipleCommande?: number // Commande par multiple de X

  // Caractéristiques physiques
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  poids?: number // en kg

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  volume?: number // en m3

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  longueur?: number // en mm

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  largeur?: number // en mm

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  hauteur?: number // en mm

  @Column({ type: 'varchar', length: 50, nullable: true })
  couleur?: string

  // Informations comptables et fiscales
  @Column({ name: 'compte_comptable_achat', type: 'varchar', length: 20, nullable: true })
  compteComptableAchat?: string

  @Column({ name: 'compte_comptable_vente', type: 'varchar', length: 20, nullable: true })
  compteComptableVente?: string

  @Column({ name: 'compte_comptable_stock', type: 'varchar', length: 20, nullable: true })
  compteComptableStock?: string

  @Column({ name: 'code_douanier', type: 'varchar', length: 10, nullable: true })
  codeDouanier?: string

  @Column({ name: 'code_ean', type: 'varchar', length: 30, nullable: true })
  @Index()
  codeEAN?: string // Code-barres

  // Métadonnées et informations techniques
  @Column({ name: 'caracteristiques_techniques', type: 'jsonb', default: {} })
  caracteristiquesTechniques?: {
    materiaux?: string[]
    certifications?: string[]
    normes?: string[]
    specifications?: Record<string, any>
    fichesSecurite?: string[]
  }

  @Column({ name: 'informations_logistiques', type: 'jsonb', default: {} })
  informationsLogistiques?: {
    emballage?: string
    conditionnement?: string
    temperatureStockage?: string
    dureeVie?: number // en jours
    stockageSpecial?: boolean
    dangereux?: boolean
    classeDanger?: string
  }

  @Column({ type: 'jsonb', default: {} })
  metadonnees?: {
    motsCles?: string[]
    categorieAnalytique?: string
    centreAnalytique?: string
    notes?: string
    lastModifiedBy?: string
    lastModifiedAt?: string
    historiqueModifications?: Array<{
      date: string
      utilisateur: string
      champ: string
      ancienneValeur: any
      nouvelleValeur: any
    }>
  }

  // Dates importantes
  @Column({ name: 'date_creation_fiche', type: 'date', nullable: true })
  dateCreationFiche?: Date

  @Column({ name: 'date_derniere_modification', type: 'date', nullable: true })
  dateDerniereModification?: Date

  @Column({ name: 'date_dernier_inventaire', type: 'date', nullable: true })
  dateDernierInventaire?: Date

  @Column({ name: 'date_dernier_mouvement', type: 'date', nullable: true })
  dateDernierMouvement?: Date

  // Colonnes marketplace
  @Column({ name: 'is_marketplace_enabled', type: 'boolean', default: false })
  isMarketplaceEnabled?: boolean

  @Column({ name: 'marketplace_settings', type: 'jsonb', nullable: true })
  marketplaceSettings?: {
    basePrice?: number
    categories?: string[]
    description?: string
    images?: string[]
    seoTitle?: string
    seoDescription?: string
    tags?: string[]
  }

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    // Validations obligatoires
    if (!this.reference?.trim()) {
      errors.push('La référence est requise')
    }

    if (!this.designation?.trim()) {
      errors.push('La désignation est requise')
    }

    if (!this.type) {
      errors.push('Le type d\'article est requis')
    }

    if (!this.uniteStock) {
      errors.push('L\'unité de stock est requise')
    }

    return errors
  }

  /**
   * Marquer l'entité comme modifiée (pour audit)
   */
  markAsModified(userId?: string): void {
    this.updatedAt = new Date()
    if (userId && this.metadonnees) {
      this.metadonnees = {
        ...this.metadonnees,
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Méthodes métier
   */

  /**
   * Calculer le stock disponible
   */
  calculerStockDisponible(): number {
    if (!this.gereEnStock) return 0
    return Math.max(0, (this.stockPhysique || 0) - (this.stockReserve || 0))
  }

  /**
   * Vérifier si l'article est en rupture
   */
  estEnRupture(): boolean {
    if (!this.gereEnStock) return false
    return this.calculerStockDisponible() <= 0
  }

  /**
   * Calculer le prix de vente TTC
   */
  getPrixVenteTTC(): number {
    if (!this.prixVenteHT) return 0
    if (!this.tauxTVA) return this.prixVenteHT
    
    return this.prixVenteHT * (1 + this.tauxTVA / 100)
  }

  /**
   * Vérifier si le stock est sous le seuil minimum
   */
  estSousStockMini(): boolean {
    if (!this.gereEnStock || !this.stockMini) return false
    return this.calculerStockDisponible() <= this.stockMini
  }

  /**
   * Calculer la quantité à commander
   */
  calculerQuantiteACommander(): number {
    if (!this.gereEnStock || !this.stockMini || !this.stockMaxi) return 0
    
    const stockDisponible = this.calculerStockDisponible()
    if (stockDisponible >= this.stockMini) return 0
    
    const quantiteOptimale = this.stockMaxi - stockDisponible
    
    // Respecter la quantité minimum de commande
    if (this.quantiteMiniCommande && quantiteOptimale < this.quantiteMiniCommande) {
      return this.quantiteMiniCommande
    }
    
    // Respecter les multiples de commande
    if (this.quantiteMultipleCommande && this.quantiteMultipleCommande > 0) {
      return Math.ceil(quantiteOptimale / this.quantiteMultipleCommande) * this.quantiteMultipleCommande
    }
    
    return quantiteOptimale
  }

  /**
   * Calculer la valeur du stock
   */
  getValeurStock(): number {
    if (!this.gereEnStock) return 0
    
    const stockDisponible = this.calculerStockDisponible()
    const prixUnitaire = this.prixAchatMoyen || this.prixAchatStandard || 0
    
    return stockDisponible * prixUnitaire
  }

  /**
   * Ajouter une modification à l'historique
   */
  ajouterModificationHistorique(utilisateur: string, champ: string, ancienneValeur: any, nouvelleValeur: any): void {
    if (!this.metadonnees) {
      this.metadonnees = {}
    }
    
    if (!this.metadonnees.historiqueModifications) {
      this.metadonnees.historiqueModifications = []
    }
    
    this.metadonnees.historiqueModifications.push({
      date: new Date().toISOString(),
      utilisateur,
      champ,
      ancienneValeur,
      nouvelleValeur
    })
    
    // Limiter l'historique à 100 entrées
    if (this.metadonnees.historiqueModifications.length > 100) {
      this.metadonnees.historiqueModifications = this.metadonnees.historiqueModifications.slice(-100)
    }
  }

  /**
   * Validation métier (BusinessEntity interface)
   */
  isValid(): boolean {
    return this.validate().length === 0
  }

  /**
   * Obtenir les erreurs de validation (BusinessEntity interface)
   */
  getValidationErrors(): string[] {
    return this.validate()
  }

  /**
   * Copier les champs communs (BusinessEntity interface)
   */
  override copyCommonFields(source: Partial<Article>): void {
    super.copyCommonFields(source)
    if (source.reference !== undefined) this.reference = source.reference
    if (source.designation !== undefined) this.designation = source.designation
    if (source.description !== undefined) this.description = source.description
    if (source.type !== undefined) this.type = source.type
    if (source.status !== undefined) this.status = source.status
    if (source.famille !== undefined) this.famille = source.famille
    if (source.sousFamille !== undefined) this.sousFamille = source.sousFamille
    if (source.marque !== undefined) this.marque = source.marque
    if (source.modele !== undefined) this.modele = source.modele
  }
}