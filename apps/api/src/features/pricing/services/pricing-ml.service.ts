import { Article } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { SalesHistory } from '../entities/sales-history.entity'

// TensorFlow.js optionnel pour Windows
let tf: any
try {
  tf = require('@tensorflow/tfjs-node')
} catch (_error) {
  // TensorFlow.js not available, ML features will be disabled
}

export interface PriceOptimizationSuggestion {
  articleId: string
  currentPrice: number
  suggestedPrice: number
  confidence: number
  expectedRevenueLift: number
  reasoning: string[]
  factors: {
    demand: number
    competition: number
    seasonality: number
    inventory: number
    margin: number
  }
}

export interface MLPricingContext {
  articleId: string
  historicalSales: Array<{
    date: Date
    price: number
    quantity: number
    revenue: number
  }>
  competitorPrices?: number[]
  inventory: number
  cost: number
  category: string
  seasonalFactors?: Record<string, number>
}

@Injectable()
export class PricingMLService {
  private readonly logger = new Logger(PricingMLService.name)
  private model: any = null
  private readonly modelPath = './models/pricing-optimization'

  constructor(
    @InjectRepository(Article, 'tenant')
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(SalesHistory, 'tenant')
    private readonly salesRepository: Repository<SalesHistory>
  ) {
    this.loadModel()
  }

  /**
   * Charge le modèle ML pré-entraîné
   */
  private async loadModel(): Promise<void> {
    if (!tf) {
      this.logger.warn('TensorFlow.js non disponible, ML désactivé')
      return
    }

    try {
      // Vérifier si un modèle existe
      if (await this.modelExists()) {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`)
        this.logger.log('Modèle ML chargé avec succès')
      } else {
        // Créer un modèle simple si aucun n'existe
        this.model = this.createBaseModel()
        this.logger.log('Modèle ML de base créé')
      }
    } catch (error) {
      this.logger.error('Erreur chargement modèle:', error)
      this.model = this.createBaseModel()
    }
  }

  /**
   * Crée un modèle de base pour la prédiction de prix
   */
  private createBaseModel(): any {
    if (!tf) {
      return null
    }

    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10], // Features: prix actuel, demande, stock, etc.
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 1, // Prix optimal
          activation: 'linear',
        }),
      ],
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    })

    return model
  }

  /**
   * Suggère un prix optimal basé sur le ML
   */
  async suggestOptimalPrice(context: MLPricingContext): Promise<PriceOptimizationSuggestion> {
    if (!tf || !this.model) {
      // Retourner une suggestion simple basée sur l'analyse sans ML
      return this.generateSimpleSuggestion(context)
    }

    try {
      // Préparer les features
      const features = await this.prepareFeatures(context)

      // Prédiction avec le modèle
      const prediction = await this.predict(features)

      // Analyser les facteurs
      const factors = this.analyzeFactors(context, features)

      // Calculer la confiance
      const confidence = this.calculateConfidence(context, prediction)

      // Estimer l'impact sur le revenue
      const revenueLift = this.estimateRevenueLift(
        context.historicalSales[0]?.price || 0,
        prediction,
        factors.demand
      )

      // Générer le raisonnement
      const reasoning = this.generateReasoning(context, factors, prediction)

      return {
        articleId: context.articleId,
        currentPrice: context.historicalSales[0]?.price || 0,
        suggestedPrice: Math.round(prediction * 100) / 100,
        confidence,
        expectedRevenueLift: revenueLift,
        reasoning,
        factors,
      }
    } catch (error) {
      this.logger.error('Erreur suggestion prix:', error)
      throw error
    }
  }

  /**
   * Prépare les features pour le modèle
   */
  private async prepareFeatures(context: MLPricingContext): Promise<number[]> {
    const recent = context.historicalSales.slice(0, 30)

    // Calculer les métriques
    const avgPrice = recent.reduce((sum, s) => sum + s.price, 0) / recent.length
    const avgQuantity = recent.reduce((sum, s) => sum + s.quantity, 0) / recent.length
    const priceElasticity = this.calculateElasticity(recent)

    // Tendance des ventes
    const salesTrend = this.calculateTrend(recent.map((s) => s.quantity))

    // Facteur saisonnier
    const currentMonth = new Date().getMonth()
    const seasonalFactor = context.seasonalFactors?.[currentMonth] || 1

    // Prix compétiteurs
    const competitorAvg = context.competitorPrices?.length
      ? context.competitorPrices.reduce((a, b) => a + b, 0) / context.competitorPrices.length
      : avgPrice

    // Ratio stock/ventes moyennes
    const stockRatio = context.inventory / (avgQuantity || 1)

    // Marge actuelle
    const currentMargin = (avgPrice - context.cost) / avgPrice

    // Jours depuis dernière vente
    const daysSinceLastSale =
      recent.length > 0
        ? Math.floor((Date.now() - recent[0].date.getTime()) / (1000 * 60 * 60 * 24))
        : 30

    // Score de popularité (basé sur fréquence d'achat)
    const popularityScore = Math.min(recent.length / 30, 1)

    return [
      avgPrice / 1000, // Normalisation
      avgQuantity / 100,
      priceElasticity,
      salesTrend,
      seasonalFactor,
      competitorAvg / avgPrice,
      stockRatio / 10,
      currentMargin,
      daysSinceLastSale / 30,
      popularityScore,
    ]
  }

  /**
   * Calcule l'élasticité prix-demande
   */
  private calculateElasticity(sales: Array<{ price: number; quantity: number }>): number {
    if (sales.length < 2) return -1

    const priceChanges: number[] = []
    const quantityChanges: number[] = []

    for (let i = 1; i < sales.length; i++) {
      const priceChange = (sales[i].price - sales[i - 1].price) / sales[i - 1].price
      const quantityChange = (sales[i].quantity - sales[i - 1].quantity) / sales[i - 1].quantity

      if (priceChange !== 0) {
        priceChanges.push(priceChange)
        quantityChanges.push(quantityChange)
      }
    }

    if (priceChanges.length === 0) return -1

    const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
    const avgQuantityChange = quantityChanges.reduce((a, b) => a + b, 0) / quantityChanges.length

    return avgPriceChange !== 0 ? avgQuantityChange / avgPriceChange : -1
  }

  /**
   * Calcule la tendance d'une série
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    return Math.tanh(slope) // Normalisation entre -1 et 1
  }

  /**
   * Fait une prédiction avec le modèle
   */
  private async predict(features: number[]): Promise<number> {
    if (!tf || !this.model) {
      throw new Error('Modèle non chargé ou TensorFlow non disponible')
    }

    const input = tf.tensor2d([features])
    const prediction = this.model.predict(input) as any
    const result = await prediction.data()

    input.dispose()
    if (prediction.dispose) {
      prediction.dispose()
    }

    return result[0] * 1000 // Dénormalisation
  }

  /**
   * Analyse les facteurs influençant le prix
   */
  private analyzeFactors(
    _context: MLPricingContext,
    features: number[]
  ): PriceOptimizationSuggestion['factors'] {
    const [, avgQuantity, _elasticity, trend, seasonality, competition, stock] = features

    return {
      demand: Math.min(Math.max(avgQuantity * 100 + trend * 20, 0), 100),
      competition: Math.min(Math.max((2 - competition) * 50, 0), 100),
      seasonality: seasonality * 100,
      inventory: Math.min(Math.max((1 - stock * 10) * 100, 0), 100),
      margin: Math.min(Math.max(features[7] * 100, 0), 100),
    }
  }

  /**
   * Calcule la confiance de la prédiction
   */
  private calculateConfidence(context: MLPricingContext, prediction: number): number {
    let confidence = 70 // Base

    // Plus de données = plus de confiance
    if (context.historicalSales.length > 50) confidence += 10
    if (context.historicalSales.length > 100) confidence += 10

    // Prix compétiteurs disponibles
    if (context.competitorPrices && context.competitorPrices.length > 0) {
      confidence += 5
    }

    // Variation raisonnable par rapport au prix actuel
    const currentPrice = context.historicalSales[0]?.price || prediction
    const variation = Math.abs(prediction - currentPrice) / currentPrice
    if (variation < 0.2) confidence += 5
    if (variation > 0.5) confidence -= 10

    return Math.min(Math.max(confidence, 0), 95)
  }

  /**
   * Estime l'impact sur le revenue
   */
  private estimateRevenueLift(
    currentPrice: number,
    suggestedPrice: number,
    _demandScore: number
  ): number {
    const priceChange = (suggestedPrice - currentPrice) / currentPrice
    const elasticity = -1.2 // Élasticité moyenne estimée
    const quantityChange = priceChange * elasticity

    const currentRevenue = 100 // Base 100
    const newRevenue = (1 + priceChange) * (1 + quantityChange) * currentRevenue

    return ((newRevenue - currentRevenue) / currentRevenue) * 100
  }

  /**
   * Génère le raisonnement de la suggestion
   */
  private generateReasoning(
    context: MLPricingContext,
    factors: PriceOptimizationSuggestion['factors'],
    prediction: number
  ): string[] {
    const reasoning: string[] = []
    const currentPrice = context.historicalSales[0]?.price || 0

    if (prediction > currentPrice) {
      reasoning.push(
        `📈 Augmentation de prix recommandée de ${(((prediction - currentPrice) / currentPrice) * 100).toFixed(1)}%`
      )

      if (factors.demand > 70) {
        reasoning.push('• Forte demande détectée sur la période récente')
      }
      if (factors.inventory < 30) {
        reasoning.push('• Stock faible justifiant une hausse de prix')
      }
      if (factors.competition < 30) {
        reasoning.push('• Prix compétitifs permettant une marge de manœuvre')
      }
    } else if (prediction < currentPrice) {
      reasoning.push(
        `📉 Baisse de prix recommandée de ${(((currentPrice - prediction) / currentPrice) * 100).toFixed(1)}%`
      )

      if (factors.demand < 30) {
        reasoning.push('• Demande faible nécessitant une stimulation')
      }
      if (factors.inventory > 70) {
        reasoning.push('• Stock élevé à écouler')
      }
      if (factors.competition > 70) {
        reasoning.push('• Pression concurrentielle importante')
      }
    } else {
      reasoning.push('✅ Prix actuel optimal')
    }

    if (factors.seasonality > 110) {
      reasoning.push(`🗓️ Période favorable (+${(factors.seasonality - 100).toFixed(0)}% saisonnier)`)
    } else if (factors.seasonality < 90) {
      reasoning.push(`🗓️ Période creuse (${(factors.seasonality - 100).toFixed(0)}% saisonnier)`)
    }

    return reasoning
  }

  /**
   * Entraîne le modèle avec de nouvelles données
   */
  async trainModel(
    trainingData: Array<{
      features: number[]
      targetPrice: number
      success: boolean
    }>
  ): Promise<void> {
    if (!tf) {
      this.logger.warn('TensorFlow non disponible, entraînement impossible')
      return
    }

    if (!this.model) {
      this.model = this.createBaseModel()
    }

    if (!this.model) {
      return
    }

    // Préparer les données
    const xs = tf.tensor2d(trainingData.map((d) => d.features))
    const ys = tf.tensor2d(trainingData.map((d) => [d.targetPrice / 1000]))

    // Entraînement
    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (
          epoch: number,
          logs?: { loss?: number; [key: string]: number | undefined }
        ) => {
          this.logger.debug(`Epoch ${epoch}: loss = ${logs?.loss}`)
        },
      },
    })

    // Sauvegarder le modèle
    await this.model.save(`file://${this.modelPath}`)

    xs.dispose()
    ys.dispose()

    this.logger.log('Modèle entraîné et sauvegardé')
  }

  /**
   * Vérifie si un modèle existe
   */
  private async modelExists(): Promise<boolean> {
    try {
      const fs = require('node:fs').promises
      await fs.access(`${this.modelPath}/model.json`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Génère une suggestion simple sans ML
   */
  private generateSimpleSuggestion(context: MLPricingContext): PriceOptimizationSuggestion {
    const currentPrice = context.historicalSales[0]?.price || 0
    const avgQuantity =
      context.historicalSales.reduce((sum, s) => sum + s.quantity, 0) /
      context.historicalSales.length

    // Logique simple basée sur l'inventaire et la demande
    let suggestedPrice = currentPrice
    const reasoning: string[] = []

    if (context.inventory > avgQuantity * 3) {
      // Stock élevé, baisser le prix
      suggestedPrice = currentPrice * 0.95
      reasoning.push('📉 Stock élevé, baisse recommandée de 5%')
    } else if (context.inventory < avgQuantity) {
      // Stock faible, augmenter le prix
      suggestedPrice = currentPrice * 1.05
      reasoning.push('📈 Stock faible, hausse recommandée de 5%')
    } else {
      reasoning.push('✅ Prix actuel optimal')
    }

    return {
      articleId: context.articleId,
      currentPrice,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      confidence: 50, // Confiance réduite sans ML
      expectedRevenueLift: 0,
      reasoning,
      factors: {
        demand: 50,
        competition: 50,
        seasonality: 100,
        inventory: (context.inventory / avgQuantity) * 33,
        margin: 50,
      },
    }
  }

  /**
   * Génère des suggestions pour tous les articles d'une société
   */
  async generateBulkSuggestions(
    societeId: string,
    limit = 50
  ): Promise<PriceOptimizationSuggestion[]> {
    // Récupérer les articles avec le plus de ventes
    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId })
      .orderBy('article.totalSales', 'DESC')
      .limit(limit)
      .getMany()

    const suggestions: PriceOptimizationSuggestion[] = []

    for (const article of articles) {
      try {
        // Récupérer l'historique des ventes
        const sales = await this.salesRepository.find({
          where: { articleId: article.id },
          order: { date: 'DESC' },
          take: 100,
        })

        if (sales.length > 10) {
          const context: MLPricingContext = {
            articleId: article.id,
            historicalSales: sales,
            inventory: article.stockDisponible || 0,
            cost: article.prixAchatMoyen || article.prixAchatStandard || 0,
            category: article.famille || 'GENERAL',
          }

          const suggestion = await this.suggestOptimalPrice(context)
          suggestions.push(suggestion)
        }
      } catch (error) {
        this.logger.error(`Erreur suggestion pour article ${article.id}:`, error)
      }
    }

    return suggestions.sort((a, b) => b.expectedRevenueLift - a.expectedRevenueLift)
  }
}
