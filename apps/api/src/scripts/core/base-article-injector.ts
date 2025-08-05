/**
 * Classe de base pour l'injection d'articles métallurgie
 * TopSteel ERP - Clean Architecture
 */

import type { DataSource, QueryRunner } from 'typeorm'
import type {
  ArticleFamille,
  ArticleMetallurgie,
  ArticleValidator,
  GlobalInjectionConfig,
  InjectionLogger,
  InjectionResult,
  PricingCalculator,
} from '../types/article-injection.types'

export abstract class BaseArticleInjector {
  protected dataSource: DataSource
  protected logger: InjectionLogger
  protected validator: ArticleValidator
  protected pricingCalculator: PricingCalculator
  protected config: GlobalInjectionConfig

  constructor(
    dataSource: DataSource,
    config: GlobalInjectionConfig,
    logger: InjectionLogger,
    validator: ArticleValidator,
    pricingCalculator: PricingCalculator
  ) {
    this.dataSource = dataSource
    this.config = config
    this.logger = logger
    this.validator = validator
    this.pricingCalculator = pricingCalculator
  }

  /**
   * Méthode abstraite pour générer les articles spécifiques à chaque famille
   */
  abstract generateArticles(): Promise<ArticleMetallurgie[]>

  /**
   * Obtenir les informations de la famille d'articles
   */
  abstract getFamilleInfo(): { famille: ArticleFamille; sousFamille: string }

  /**
   * Method principale d'injection
   */
  async inject(): Promise<InjectionResult> {
    const startTime = Date.now()
    const { famille, sousFamille } = this.getFamilleInfo()

    this.logger.info(`Début injection ${famille}/${sousFamille}`)

    const result: InjectionResult = {
      famille,
      sousFamille,
      articlesCreated: 0,
      articlesSkipped: 0,
      errors: [],
      duration: 0,
      examples: [],
    }

    let queryRunner: QueryRunner | null = null

    try {
      // Générer les articles
      const articles = await this.generateArticles()
      this.logger.info(`${articles.length} articles générés pour ${famille}/${sousFamille}`)

      if (articles.length === 0) {
        this.logger.warn(`Aucun article généré pour ${famille}/${sousFamille}`)
        result.duration = Date.now() - startTime
        return result
      }

      // Initialiser la transaction
      queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      // Nettoyer les articles existants si demandé
      if (this.config.cleanupExisting) {
        await this.cleanupExistingArticles(queryRunner, famille, sousFamille)
      }

      // Traiter les articles par lots
      const batchSize = this.config.batchSize || 50
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize)
        const batchResult = await this.processBatch(queryRunner, batch)

        result.articlesCreated += batchResult.created
        result.articlesSkipped += batchResult.skipped
        result.errors.push(...batchResult.errors)
      }

      // Collecter des exemples
      result.examples = articles.slice(0, 3).map((article) => ({
        reference: article.reference,
        designation: article.designation,
        price: article.prixVenteHt || 0,
      }))

      await queryRunner.commitTransaction()
      this.logger.info(`Injection ${famille}/${sousFamille} terminée avec succès`)
    } catch (error) {
      if (queryRunner) {
        await queryRunner.rollbackTransaction()
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMessage)
      this.logger.error(
        `Erreur lors de l'injection ${famille}/${sousFamille}`,
        error instanceof Error ? error : undefined
      )

      if (!this.config.skipOnError) {
        throw error
      }
    } finally {
      if (queryRunner) {
        await queryRunner.release()
      }

      result.duration = Date.now() - startTime
      this.logger.logResult(result)
    }

    return result
  }

  /**
   * Nettoyer les articles existants
   */
  protected async cleanupExistingArticles(
    queryRunner: QueryRunner,
    famille: string,
    sousFamille: string
  ): Promise<void> {
    this.logger.info(`Nettoyage des articles existants ${famille}/${sousFamille}`)

    const result = await queryRunner.query(
      `DELETE FROM articles 
       WHERE societe_id = $1 AND famille = $2 AND sous_famille = $3`,
      [this.config.societeId, famille, sousFamille]
    )

    this.logger.info(`${result.affectedRows || result.length || 0} articles supprimés`)
  }

  /**
   * Traiter un lot d'articles
   */
  protected async processBatch(
    queryRunner: QueryRunner,
    articles: ArticleMetallurgie[]
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const article of articles) {
      try {
        // Validation
        if (!this.validateArticle(article)) {
          skipped++
          continue
        }

        // Vérifier si l'article existe déjà
        if (
          this.config.validateReferences &&
          (await this.articleExists(queryRunner, article.reference))
        ) {
          this.logger.debug(`Article ${article.reference} existe déjà, ignoré`)
          skipped++
          continue
        }

        // Insérer l'article
        await this.insertArticle(queryRunner, article)
        created++

        this.logger.debug(`Article ${article.reference} créé`)
      } catch (error) {
        const errorMessage = `Erreur article ${article.reference}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMessage)

        if (!this.config.skipOnError) {
          throw error
        }
      }
    }

    return { created, skipped, errors }
  }

  /**
   * Valider un article
   */
  protected validateArticle(article: ArticleMetallurgie): boolean {
    if (!this.validator.validateReference(article.reference)) {
      this.logger.warn(`Référence invalide: ${article.reference}`)
      return false
    }

    if (!this.validator.validateDimensions(article.caracteristiquesTechniques)) {
      this.logger.warn(`Dimensions invalides pour: ${article.reference}`)
      return false
    }

    if (!this.validator.validatePricing(article)) {
      this.logger.warn(`Prix invalide pour: ${article.reference}`)
      return false
    }

    if (
      !this.validator.validateTechnicalSpecs(article.caracteristiquesTechniques, article.famille)
    ) {
      this.logger.warn(`Spécifications techniques invalides pour: ${article.reference}`)
      return false
    }

    return true
  }

  /**
   * Vérifier si un article existe déjà
   */
  protected async articleExists(queryRunner: QueryRunner, reference: string): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT 1 FROM articles WHERE reference = $1 AND societe_id = $2 LIMIT 1`,
      [reference, this.config.societeId]
    )
    return result.length > 0
  }

  /**
   * Insérer un article en base
   */
  protected async insertArticle(
    queryRunner: QueryRunner,
    article: ArticleMetallurgie
  ): Promise<void> {
    const query = `
      INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
      )
    `

    const parameters = [
      article.reference,
      article.designation,
      article.description,
      article.type,
      article.status,
      article.famille,
      article.sousFamille,
      article.uniteStock,
      article.uniteAchat || article.uniteStock,
      article.uniteVente || article.uniteStock,
      article.coefficientAchat || 1.0,
      article.coefficientVente || 1.0,
      article.gereEnStock,
      article.poids,
      article.prixAchatStandard,
      article.prixVenteHt,
      article.tauxMarge,
      JSON.stringify(article.caracteristiquesTechniques),
      this.config.societeId,
    ]

    await queryRunner.query(query, parameters)
  }

  /**
   * Calculer le prix de vente basé sur les caractéristiques
   */
  protected calculatePricing(article: ArticleMetallurgie): void {
    if (!article.prixVenteHt) {
      const basePrice = this.pricingCalculator.calculateBasePrice(
        article.caracteristiquesTechniques,
        article.caracteristiquesTechniques.nuance || 'S235JR'
      )

      const margin = this.pricingCalculator.calculateMargin(basePrice, article.famille)
      article.tauxMarge = margin
      article.prixVenteHt = basePrice * (1 + margin / 100)

      // Arrondir à 2 décimales
      article.prixVenteHt = Math.round(article.prixVenteHt * 100) / 100
    }
  }

  /**
   * Obtenir les statistiques d'injection
   */
  async getInjectionStats(): Promise<{
    totalArticles: number
    articlesByFamily: Record<string, number>
    recentInjections: Array<{ famille: string; count: number; date: Date }>
  }> {
    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM articles WHERE societe_id = $1`,
      [this.config.societeId]
    )

    const familyResult = await this.dataSource.query(
      `SELECT famille, COUNT(*) as count 
       FROM articles 
       WHERE societe_id = $1 
       GROUP BY famille`,
      [this.config.societeId]
    )

    const recentResult = await this.dataSource.query(
      `SELECT famille, COUNT(*) as count, DATE(created_at) as date
       FROM articles 
       WHERE societe_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY famille, DATE(created_at)
       ORDER BY date DESC`,
      [this.config.societeId]
    )

    return {
      totalArticles: parseInt(totalResult[0].count),
      articlesByFamily: familyResult.reduce((acc: Record<string, number>, row: any) => {
        acc[row.famille] = parseInt(row.count)
        return acc
      }, {}),
      recentInjections: recentResult.map((row: any) => ({
        famille: row.famille,
        count: parseInt(row.count),
        date: new Date(row.date),
      })),
    }
  }
}
