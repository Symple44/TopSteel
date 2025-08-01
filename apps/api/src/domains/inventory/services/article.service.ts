import { Inject, Injectable } from '@nestjs/common'
import { BusinessService } from '../../core/base/business-service'
import { BusinessOperation, type BusinessContext, type ValidationResult } from '../../core/interfaces/business-service.interface'
import { Article, ArticleStatus, ArticleType } from '../entities/article.entity'
import { IArticleRepository } from '../repositories/article.repository'

/**
 * Service métier pour la gestion des articles
 */
@Injectable()
export class ArticleService extends BusinessService<Article> {
  constructor(
    @Inject('IArticleRepository')
    private readonly articleRepository: IArticleRepository
  ) {
    super(articleRepository, 'ArticleService')
  }

  /**
   * Valider les règles métier spécifiques aux articles
   */
  async validateBusinessRules(entity: Article, operation: BusinessOperation): Promise<ValidationResult> {
    const errors: Array<{field: string, message: string, code: string}> = []
    const warnings: Array<{field: string, message: string, code: string}> = []

    // 1. Validation de base de l'entité
    const entityErrors = entity.validate()
    errors.push(...entityErrors.map(msg => ({ field: 'general', message: msg, code: 'VALIDATION_ERROR' })))

    // 2. Règles métier spécifiques selon l'opération
    switch (operation) {
      case BusinessOperation.CREATE:
        await this.validateCreationRules(entity, errors, warnings)
        break
      case BusinessOperation.UPDATE:
        await this.validateUpdateRules(entity, errors, warnings)
        break
      case BusinessOperation.DELETE:
        await this.validateDeletionRules(entity, errors, warnings)
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Construire une entité Article
   */
  protected async buildEntity(data: Partial<Article>): Promise<Article> {
    const article = new Article()
    
    // Générer une référence automatique si non fournie
    if (!data.reference) {
      article.reference = await this.generateReference(data.type!)
    } else {
      article.reference = data.reference
    }

    // Informations de base obligatoires
    article.designation = data.designation || ''
    article.type = data.type!
    article.status = data.status || ArticleStatus.ACTIF
    article.description = data.description

    // Classification
    article.famille = data.famille
    article.sousFamille = data.sousFamille
    article.marque = data.marque
    article.modele = data.modele

    // Unités
    article.uniteStock = data.uniteStock!
    article.uniteAchat = data.uniteAchat
    article.uniteVente = data.uniteVente
    article.coefficientAchat = data.coefficientAchat || 1
    article.coefficientVente = data.coefficientVente || 1

    // Gestion des stocks
    article.gereEnStock = data.gereEnStock !== false // true par défaut
    article.stockPhysique = data.stockPhysique || 0
    article.stockReserve = data.stockReserve || 0
    article.stockMini = data.stockMini
    article.stockMaxi = data.stockMaxi
    article.stockSecurite = data.stockSecurite
    article.methodeValorisation = data.methodeValorisation!

    // Prix
    article.prixAchatStandard = data.prixAchatStandard
    article.prixAchatMoyen = data.prixAchatMoyen
    article.prixVenteHT = data.prixVenteHT
    article.tauxTVA = data.tauxTVA
    article.tauxMarge = data.tauxMarge

    // Fournisseur
    article.fournisseurPrincipalId = data.fournisseurPrincipalId
    article.referenceFournisseur = data.referenceFournisseur
    article.delaiApprovisionnement = data.delaiApprovisionnement
    article.quantiteMiniCommande = data.quantiteMiniCommande
    article.quantiteMultipleCommande = data.quantiteMultipleCommande

    // Caractéristiques physiques
    article.poids = data.poids
    article.volume = data.volume
    article.longueur = data.longueur
    article.largeur = data.largeur
    article.hauteur = data.hauteur
    article.couleur = data.couleur

    // Comptabilité
    article.compteComptableAchat = data.compteComptableAchat
    article.compteComptableVente = data.compteComptableVente
    article.compteComptableStock = data.compteComptableStock
    article.codeDouanier = data.codeDouanier
    article.codeEAN = data.codeEAN

    // Métadonnées
    article.caracteristiquesTechniques = data.caracteristiquesTechniques || {}
    article.informationsLogistiques = data.informationsLogistiques || {}
    article.metadonnees = data.metadonnees || {}

    // Dates
    article.dateCreationFiche = new Date()

    return article
  }

  /**
   * Appliquer les mises à jour
   */
  protected async applyUpdates(existing: Article, updates: Partial<Article>): Promise<Article> {
    // Conserver l'ancienne valeur pour l'historique
    const oldValues = { ...existing }

    // Appliquer les mises à jour (sauf référence qui ne peut pas changer)
    Object.keys(updates).forEach(key => {
      if (key !== 'reference' && updates[key] !== undefined) {
        const oldValue = existing[key]
        existing[key] = updates[key]
        
        // Ajouter à l'historique si la valeur a changé
        if (oldValue !== updates[key]) {
          existing.ajouterModificationHistorique(key, oldValue, updates[key], 'SYSTEM')
        }
      }
    })

    // Recalculer le stock disponible
    if (existing.gereEnStock) {
      existing.stockDisponible = existing.calculerStockDisponible()
    }

    existing.dateDerniereModification = new Date()
    existing.markAsModified()
    return existing
  }

  protected getEntityName(): string {
    return 'Article'
  }

  /**
   * Méthodes métier spécifiques
   */

  /**
   * Rechercher des articles par critères
   */
  async searchArticles(criteria: ArticleSearchCriteria): Promise<Article[]> {
    this.logger.log('Recherche d\'articles avec critères', criteria)
    return await this.articleRepository.searchByCriteria(criteria)
  }

  /**
   * Obtenir les articles en rupture
   */
  async getArticlesEnRupture(): Promise<Article[]> {
    return await this.articleRepository.findByStockCondition('rupture')
  }

  /**
   * Obtenir les articles sous stock minimum
   */
  async getArticlesSousStockMini(): Promise<Article[]> {
    return await this.articleRepository.findByStockCondition('sous_mini')
  }

  /**
   * Obtenir les articles à réapprovisionner
   */
  async getArticlesAReapprovisionner(): Promise<Array<Article & { quantiteACommander: number }>> {
    const articles = await this.getArticlesSousStockMini()
    
    return articles.map(article => Object.assign(article, {
      quantiteACommander: article.calculerQuantiteACommander()
    })).filter(item => item.quantiteACommander > 0)
  }

  /**
   * Créer automatiquement une commande de réapprovisionnement
   */
  async creerCommandeReapprovisionnement(
    fournisseurId: string,
    context?: BusinessContext
  ): Promise<{ articles: Article[], quantitesTotales: number }> {
    const articlesAReapprovisionner = await this.getArticlesAReapprovisionner()
    
    // Filtrer par fournisseur
    const articlesFournisseur = articlesAReapprovisionner.filter(
      item => item.fournisseurPrincipalId === fournisseurId
    )

    if (articlesFournisseur.length === 0) {
      throw new Error('Aucun article à réapprovisionner pour ce fournisseur')
    }

    // Ici vous pourriez créer une commande fournisseur
    // Pour l'exemple, on retourne juste les données
    const quantitesTotales = articlesFournisseur.reduce(
      (sum, item) => sum + item.quantiteACommander, 0
    )

    this.logger.log(`Commande de réapprovisionnement créée: ${articlesFournisseur.length} articles, ${quantitesTotales} unités`)

    return {
      articles: articlesFournisseur,
      quantitesTotales
    }
  }

  /**
   * Effectuer un inventaire sur un article
   */
  async effectuerInventaire(
    articleId: string,
    stockPhysiqueReel: number,
    commentaire?: string,
    context?: BusinessContext
  ): Promise<Article> {
    const article = await this.findById(articleId, context)
    if (!article) {
      throw new Error('Article introuvable')
    }

    if (!article.gereEnStock) {
      throw new Error('Cet article n\'est pas géré en stock')
    }

    const ancienStock = article.stockPhysique || 0
    const ecart = stockPhysiqueReel - ancienStock

    // Mettre à jour le stock
    article.stockPhysique = stockPhysiqueReel
    article.stockDisponible = article.calculerStockDisponible()
    article.dateDernierInventaire = new Date()

    // Ajouter à l'historique
    article.ajouterModificationHistorique(
      'inventaire',
      ancienStock,
      stockPhysiqueReel,
      context?.userId || 'SYSTEM'
    )

    if (commentaire) {
      if (!article.metadonnees) article.metadonnees = {}
      article.metadonnees.notes = commentaire
    }

    const updatedArticle = await this.repository.save(article)

    this.logger.log(`Inventaire effectué sur ${article.reference}: ${ancienStock} → ${stockPhysiqueReel} (écart: ${ecart})`)

    return updatedArticle
  }

  /**
   * Calculer la valorisation totale du stock
   */
  async calculerValorisationStock(famille?: string): Promise<StockValorisation> {
    let articles: Article[]
    
    if (famille) {
      articles = await this.articleRepository.findByFamille(famille)
    } else {
      articles = await this.articleRepository.findByStatus(ArticleStatus.ACTIF)
    }

    const valorisation: StockValorisation = {
      nombreArticles: articles.length,
      valeurTotale: 0,
      valeurParFamille: {},
      articlesSansStock: 0,
      articlesEnRupture: 0,
      articlesSousStockMini: 0
    }

    articles.forEach(article => {
      if (article.gereEnStock) {
        const valeurArticle = article.getValeurStock()
        valorisation.valeurTotale += valeurArticle

        // Par famille
        const famille = article.famille || 'Non classé'
        if (!valorisation.valeurParFamille[famille]) {
          valorisation.valeurParFamille[famille] = 0
        }
        valorisation.valeurParFamille[famille] += valeurArticle

        // Statistiques de stock
        if ((article.stockPhysique || 0) === 0) {
          valorisation.articlesSansStock++
        }
        if (article.estEnRupture()) {
          valorisation.articlesEnRupture++
        }
        if (article.estSousStockMini()) {
          valorisation.articlesSousStockMini++
        }
      }
    })

    return valorisation
  }

  /**
   * Obtenir les statistiques des articles
   */
  async getStatistiques(): Promise<ArticleStatistics> {
    return await this.articleRepository.getArticleStats()
  }

  /**
   * Dupliquer un article (pour créer une variante)
   */
  async dupliquerArticle(
    articleId: string,
    nouvelleReference: string,
    modifications: Partial<Article> = {},
    context?: BusinessContext
  ): Promise<Article> {
    const articleOriginal = await this.findById(articleId, context)
    if (!articleOriginal) {
      throw new Error('Article original introuvable')
    }

    // Créer une copie
    const articleCopie = { ...articleOriginal }
    delete (articleCopie as any).id
    delete (articleCopie as any).createdAt
    delete (articleCopie as any).updatedAt

    // Appliquer les modifications
    articleCopie.reference = nouvelleReference
    Object.assign(articleCopie, modifications)

    // Réinitialiser les stocks
    articleCopie.stockPhysique = 0
    articleCopie.stockReserve = 0
    articleCopie.stockDisponible = 0

    // Ajouter une note sur l'origine
    if (!articleCopie.metadonnees) articleCopie.metadonnees = {}
    articleCopie.metadonnees.notes = `Créé par duplication de ${articleOriginal.reference}`

    return await this.create(articleCopie, context)
  }

  /**
   * Méthodes privées
   */

  private async validateCreationRules(entity: Article, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Vérifier l'unicité de la référence
    const existingByRef = await this.articleRepository.findByReference(entity.reference)
    if (existingByRef) {
      errors.push({ field: 'reference', message: 'Cette référence existe déjà', code: 'REFERENCE_DUPLICATE' })
    }

    // Vérifier l'unicité du code EAN si fourni
    if (entity.codeEAN) {
      const existingByEAN = await this.articleRepository.findByCodeEAN(entity.codeEAN)
      if (existingByEAN) {
        errors.push({ field: 'codeEAN', message: 'Ce code EAN existe déjà', code: 'EAN_DUPLICATE' })
      }
    }

    // Vérifier que le fournisseur existe si spécifié
    if (entity.fournisseurPrincipalId) {
      // Ici vous pourriez vérifier que le fournisseur existe
      // const fournisseur = await this.partnerService.findById(entity.fournisseurPrincipalId)
      // if (!fournisseur || !fournisseur.isFournisseur()) {
      //   errors.push({ field: 'fournisseurPrincipalId', message: 'Fournisseur invalide', code: 'INVALID_SUPPLIER' })
      // }
    }
  }

  private async validateUpdateRules(entity: Article, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Un article avec des mouvements de stock ne peut pas changer d'unité
    const hasStockMovements = await this.articleRepository.hasStockMovements(entity.id)
    if (hasStockMovements) {
      warnings.push({ field: 'uniteStock', message: 'Cet article a des mouvements de stock', code: 'HAS_MOVEMENTS' })
    }
  }

  private async validateDeletionRules(entity: Article, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Interdire la suppression si l'article a du stock
    if (entity.gereEnStock && (entity.stockPhysique || 0) > 0) {
      errors.push({ field: 'general', message: 'Impossible de supprimer un article avec du stock', code: 'HAS_STOCK' })
    }

    // Interdire la suppression si l'article a des mouvements
    const hasMovements = await this.articleRepository.hasStockMovements(entity.id)
    if (hasMovements) {
      errors.push({ field: 'general', message: 'Impossible de supprimer un article avec des mouvements', code: 'HAS_MOVEMENTS' })
    }
  }

  private async generateReference(type: ArticleType): Promise<string> {
    const prefixes = {
      [ArticleType.MATIERE_PREMIERE]: 'MP',
      [ArticleType.PRODUIT_FINI]: 'PF',
      [ArticleType.PRODUIT_SEMI_FINI]: 'PSF',
      [ArticleType.FOURNITURE]: 'FOU',
      [ArticleType.CONSOMMABLE]: 'CON',
      [ArticleType.SERVICE]: 'SER'
    }

    const prefix = prefixes[type] || 'ART'
    const count = await this.articleRepository.countByType(type)
    
    return `${prefix}-${(count + 1).toString().padStart(6, '0')}`
  }
}

/**
 * Interfaces pour les critères de recherche et statistiques
 */
export interface ArticleSearchCriteria {
  type?: ArticleType[]
  status?: ArticleStatus[]
  famille?: string[]
  designation?: string
  reference?: string
  marque?: string
  fournisseurId?: string
  gereEnStock?: boolean
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface StockValorisation {
  nombreArticles: number
  valeurTotale: number
  valeurParFamille: Record<string, number>
  articlesSansStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
}

export interface ArticleStatistics {
  totalArticles: number
  repartitionParType: Record<ArticleType, number>
  repartitionParStatus: Record<ArticleStatus, number>
  repartitionParFamille: Record<string, number>
  articlesGeresEnStock: number
  valeurTotaleStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
  articlesObsoletes: number
}