import { Column, Entity, Index, OneToMany } from 'typeorm'
import { BusinessEntity } from '../../core/base/business-entity'

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
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  famille?: string // Famille d'articles

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  sousFamille?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  modele?: string

  // Unités et gestion stock
  @Column({ type: 'enum', enum: UniteStock, default: UniteStock.PIECE })
  uniteStock!: UniteStock

  @Column({ type: 'enum', enum: UniteStock, nullable: true })
  uniteAchat?: UniteStock // Si différente de l'unité stock

  @Column({ type: 'enum', enum: UniteStock, nullable: true })
  uniteVente?: UniteStock // Si différente de l'unité stock

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  coefficientAchat?: number // Conversion unité achat -> unité stock

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  coefficientVente?: number // Conversion unité stock -> unité vente

  // Gestion des stocks
  @Column({ type: 'boolean', default: true })
  @Index()
  gereEnStock!: boolean

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockPhysique?: number

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockReserve?: number // Stock réservé (commandes)

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockDisponible?: number // Stock physique - stock réservé

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockMini?: number // Seuil de réapprovisionnement

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockMaxi?: number // Stock maximum

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  stockSecurite?: number // Stock de sécurité

  // Valorisation
  @Column({ type: 'enum', enum: MethodeValorisationStock, default: MethodeValorisationStock.CMUP })
  methodeValorisation!: MethodeValorisationStock

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixAchatStandard?: number

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixAchatMoyen?: number // CMUP

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixVenteHT?: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxTVA?: number // Taux de TVA en %

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxMarge?: number // Marge en %

  // Informations fournisseur principal
  @Column({ type: 'uuid', nullable: true })
  @Index()
  fournisseurPrincipalId?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceFournisseur?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  delaiApprovisionnement?: string // Ex: "5J", "2S"

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  quantiteMiniCommande?: number

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
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
  @Column({ type: 'varchar', length: 20, nullable: true })
  compteComptableAchat?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  compteComptableVente?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  compteComptableStock?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  codeDouanier?: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  @Index()
  codeEAN?: string // Code-barres

  // Métadonnées et informations techniques
  @Column({ type: 'jsonb', default: {} })
  caracteristiquesTechniques?: {
    materiaux?: string[]
    certifications?: string[]
    normes?: string[]
    specifications?: Record<string, any>
    fichesSecurite?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
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
    historiqueModifications?: Array<{
      date: string
      utilisateur: string
      champ: string
      ancienneValeur: any
      nouvelleValeur: any
    }>
  }

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateCreationFiche?: Date

  @Column({ type: 'date', nullable: true })
  dateDerniereModification?: Date

  @Column({ type: 'date', nullable: true })
  dateDernierInventaire?: Date

  @Column({ type: 'date', nullable: true })
  dateDernierMouvement?: Date

  // Relations (à définir selon vos besoins)
  // @OneToMany('MouvementStock', 'article')
  // mouvementsStock!: MouvementStock[]

  // @OneToMany('ArticleFournisseur', 'article')
  // fournisseurs!: ArticleFournisseur[]

  // @OneToMany('LigneCommande', 'article')
  // lignesCommande!: LigneCommande[]

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

    // Validations conditionnelles
    if (this.gereEnStock) {
      if (this.stockMini !== null && this.stockMini !== undefined && this.stockMini < 0) {
        errors.push('Le stock minimum ne peut pas être négatif')
      }

      if (this.stockMaxi !== null && this.stockMaxi !== undefined && this.stockMaxi < 0) {
        errors.push('Le stock maximum ne peut pas être négatif')
      }

      if (this.stockMini && this.stockMaxi && this.stockMini > this.stockMaxi) {
        errors.push('Le stock minimum ne peut pas être supérieur au stock maximum')
      }
    }

    // Validations des prix
    if (this.prixAchatStandard !== null && this.prixAchatStandard !== undefined && this.prixAchatStandard < 0) {
      errors.push('Le prix d\'achat ne peut pas être négatif')
    }

    if (this.prixVenteHT !== null && this.prixVenteHT !== undefined && this.prixVenteHT < 0) {
      errors.push('Le prix de vente ne peut pas être négatif')
    }

    if (this.tauxTVA !== null && this.tauxTVA !== undefined && (this.tauxTVA < 0 || this.tauxTVA > 100)) {
      errors.push('Le taux de TVA doit être entre 0 et 100%')
    }

    if (this.tauxMarge !== null && this.tauxMarge !== undefined && this.tauxMarge < 0) {
      errors.push('Le taux de marge ne peut pas être négatif')
    }

    // Validations des coefficients
    if (this.coefficientAchat !== null && this.coefficientAchat !== undefined && this.coefficientAchat <= 0) {
      errors.push('Le coefficient d\'achat doit être positif')
    }

    if (this.coefficientVente !== null && this.coefficientVente !== undefined && this.coefficientVente <= 0) {
      errors.push('Le coefficient de vente doit être positif')
    }

    // Validations physiques
    if (this.poids !== null && this.poids !== undefined && this.poids < 0) {
      errors.push('Le poids ne peut pas être négatif')
    }

    if (this.volume !== null && this.volume !== undefined && this.volume < 0) {
      errors.push('Le volume ne peut pas être négatif')
    }

    return errors
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
   * Vérifier si l'article est en dessous du stock minimum
   */
  estSousStockMini(): boolean {
    if (!this.gereEnStock || !this.stockMini) return false
    return this.calculerStockDisponible() < this.stockMini
  }

  /**
   * Calculer la quantité à commander pour atteindre le stock maximum
   */
  calculerQuantiteACommander(): number {
    if (!this.gereEnStock || !this.stockMaxi) return 0
    
    const stockDisponible = this.calculerStockDisponible()
    const quantiteNecessaire = this.stockMaxi - stockDisponible
    
    // Appliquer la quantité minimale de commande
    if (this.quantiteMiniCommande && quantiteNecessaire < this.quantiteMiniCommande) {
      return this.quantiteMiniCommande
    }

    // Appliquer le multiple de commande
    if (this.quantiteMultipleCommande && this.quantiteMultipleCommande > 0) {
      return Math.ceil(quantiteNecessaire / this.quantiteMultipleCommande) * this.quantiteMultipleCommande
    }

    return Math.max(0, quantiteNecessaire)
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
   * Calculer la marge en valeur
   */
  getMargeEnValeur(): number {
    if (!this.prixVenteHT || !this.prixAchatMoyen) return 0
    return this.prixVenteHT - this.prixAchatMoyen
  }

  /**
   * Calculer le taux de marge réel
   */
  getTauxMargeReel(): number {
    if (!this.prixAchatMoyen || this.prixAchatMoyen === 0) return 0
    const marge = this.getMargeEnValeur()
    return (marge / this.prixAchatMoyen) * 100
  }

  /**
   * Convertir une quantité d'une unité à l'unité de stock
   */
  convertirVersUniteStock(quantite: number, uniteOrigine: UniteStock): number {
    if (uniteOrigine === this.uniteStock) return quantite
    
    if (uniteOrigine === this.uniteAchat && this.coefficientAchat) {
      return quantite * this.coefficientAchat
    }
    
    if (uniteOrigine === this.uniteVente && this.coefficientVente) {
      return quantite / this.coefficientVente
    }
    
    // Si pas de coefficient défini, retourner la quantité telle quelle
    return quantite
  }

  /**
   * Activer/Désactiver l'article
   */
  activer(): void {
    this.status = ArticleStatus.ACTIF
    this.markAsModified()
  }

  desactiver(): void {
    this.status = ArticleStatus.INACTIF
    this.markAsModified()
  }

  marquerObsolete(): void {
    this.status = ArticleStatus.OBSOLETE
    this.markAsModified()
  }

  /**
   * Ajouter une modification à l'historique
   */
  ajouterModificationHistorique(champ: string, ancienneValeur: any, nouvelleValeur: any, utilisateur: string): void {
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

    this.dateDerniereModification = new Date()
    this.markAsModified()
  }

  /**
   * Vérifier si l'article nécessite un stockage spécial
   */
  necessiteStockageSpecial(): boolean {
    return this.informationsLogistiques?.stockageSpecial === true ||
           this.informationsLogistiques?.dangereux === true ||
           !!this.informationsLogistiques?.temperatureStockage
  }

  /**
   * Calculer la valeur du stock
   */
  getValeurStock(): number {
    if (!this.gereEnStock || !this.stockPhysique) return 0
    
    const prixUnitaire = this.prixAchatMoyen || this.prixAchatStandard || 0
    return this.stockPhysique * prixUnitaire
  }

  /**
   * Obtenir le délai d'approvisionnement en jours
   */
  getDelaiApprovisionnementJours(): number {
    if (!this.delaiApprovisionnement) return 0
    
    const match = this.delaiApprovisionnement.match(/(\d+)([JS])/)
    if (!match) return 0
    
    const nombre = parseInt(match[1])
    const unite = match[2]
    
    return unite === 'J' ? nombre : nombre * 7 // S = semaines
  }
}