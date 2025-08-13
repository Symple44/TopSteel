import { AdjustmentType, Article, PriceRule, PriceRuleChannel } from '@erp/entities'
import { UnitConversionService } from '@erp/utils'
import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import * as mathjs from 'mathjs'
import type { DataSource, Repository } from 'typeorm'

export interface PricingContext {
  // Identifiants
  articleId?: string
  articleReference?: string
  customerId?: string
  societeId: string

  // Données article
  article?: {
    id: string
    reference: string
    designation: string
    famille?: string
    prixVenteHT?: number
    prixAchatHT?: number
    poids?: number
    longueur?: number
    largeur?: number
    hauteur?: number
    surface?: number
    volume?: number
    uniteStock?: string
    uniteVente?: string
    uniteAchat?: string
    coefficientVente?: number
    coefficientAchat?: number
  }

  // Contexte commercial
  quantity?: number
  customerGroup?: string
  customerEmail?: string
  channel?: PriceRuleChannel
  promotionCode?: string

  // Métadonnées
  isFirstOrder?: boolean
  orderTotal?: number
}

export interface PriceCalculationResult {
  basePrice: number
  finalPrice: number
  currency: string
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    ruleType: AdjustmentType
    adjustment: number
    adjustmentUnit?: string
    discountAmount: number
    discountPercentage: number
  }>
  totalDiscount: number
  totalDiscountPercentage: number
  unitPrice?: {
    value: number
    unit: string
  }
  warnings?: string[]
  // Extended fields for detailed response
  breakdown?: {
    steps: Array<{
      stepNumber: number
      ruleName: string
      ruleId: string
      priceBefore: number
      priceAfter: number
      adjustment: number
      adjustmentType: string
      description: string
    }>
    skippedRules?: Array<{
      ruleId: string
      ruleName: string
      reason: string
      priority: number
    }>
    context: {
      article: {
        id: string
        reference: string
        designation: string
        famille?: string
        dimensions?: {
          poids?: number
          longueur?: number
          largeur?: number
          hauteur?: number
          surface?: number
          volume?: number
        }
        units?: {
          stock?: string
          vente?: string
          achat?: string
        }
      }
      customer?: {
        id?: string
        group?: string
        email?: string
      }
      quantity: number
      channel: string
    }
    margins?: {
      costPrice?: number
      sellingPrice: number
      margin: number
      marginPercentage: number
      markupPercentage: number
    }
    metadata?: {
      calculationTime: number
      rulesEvaluated: number
      rulesApplied: number
      cacheHit: boolean
    }
  }
}

@Injectable()
export class PricingEngineService {
  private readonly logger = new Logger(PricingEngineService.name)
  private readonly mathParser = mathjs.parser()

  constructor(
    @InjectRepository(PriceRule, 'tenant')
    private readonly priceRuleRepository: Repository<PriceRule>,

    @InjectRepository(Article, 'tenant')
    private readonly articleRepository: Repository<Article>,

    @InjectDataSource('tenant') readonly _dataSource: DataSource
  ) {}

  /**
   * Calcule le prix d'un article en appliquant les règles de prix
   */
  async calculatePrice(
    context: PricingContext,
    options?: {
      detailed?: boolean
      includeMargins?: boolean
      includeSkippedRules?: boolean
    }
  ): Promise<PriceCalculationResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const breakdownSteps: any[] = []
    const skippedRules: any[] = []
    let stepNumber = 0

    // 1. Récupérer l'article si non fourni
    let article = context.article
    if (!article && (context.articleId || context.articleReference)) {
      article = await this.fetchArticle(
        context.articleId || '',
        context.articleReference,
        context.societeId
      )
      if (!article) {
        warnings.push('Article introuvable')
        return this.createEmptyResult(warnings)
      }
    }

    if (!article) {
      warnings.push('Aucun article spécifié')
      return this.createEmptyResult(warnings)
    }

    // Appliquer le coefficient de vente si présent
    let basePrice = article.prixVenteHT || 0
    const _originalPrice = basePrice

    if (article.coefficientVente && article.coefficientVente !== 1) {
      const previousPrice = basePrice
      basePrice = basePrice * article.coefficientVente
      this.logger.log(
        `Coefficient de vente appliqué: ${article.coefficientVente} -> Prix ajusté: ${basePrice}€`
      )

      if (options?.detailed) {
        breakdownSteps.push({
          stepNumber: ++stepNumber,
          ruleName: 'Coefficient de vente',
          ruleId: 'coefficient',
          priceBefore: previousPrice,
          priceAfter: basePrice,
          adjustment: basePrice - previousPrice,
          adjustmentType: 'COEFFICIENT',
          description: `Application du coefficient de vente ${article.coefficientVente}`,
        })
      }
    }

    // 2. Récupérer toutes les règles potentielles
    const allRules = await this.getAllRulesForEvaluation(article, context)

    // 3. Filtrer les règles applicables et capturer les règles non applicables
    const applicableRules: PriceRule[] = []

    for (const rule of allRules) {
      const enrichedContext = {
        ...context,
        article_reference: article.reference,
        article_family: article.famille,
        quantity: context.quantity || 1,
      }

      if (rule.canBeApplied(enrichedContext)) {
        applicableRules.push(rule)
      } else if (options?.includeSkippedRules) {
        // Déterminer la raison du skip
        let reason = 'Conditions non remplies'

        if (rule.validFrom && new Date(rule.validFrom) > new Date()) {
          reason = 'Règle pas encore valide'
        } else if (rule.validUntil && new Date(rule.validUntil) < new Date()) {
          reason = 'Règle expirée'
        } else if (rule.usageLimit && rule.usageCount >= rule.usageLimit) {
          reason = "Limite d'utilisation atteinte"
        } else if (!rule.isActive) {
          reason = 'Règle inactive'
        }

        skippedRules.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          reason,
          priority: rule.priority,
        })
      }
    }

    // 4. Appliquer les règles par ordre de priorité
    let currentPrice = basePrice
    const appliedRules: PriceCalculationResult['appliedRules'] = []

    for (const rule of applicableRules) {
      try {
        const ruleResult = await this.applyRule(rule, currentPrice, article, context)

        if (ruleResult.newPrice !== currentPrice) {
          const previousPrice = currentPrice

          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.ruleName,
            ruleType: rule.adjustmentType,
            adjustment: rule.adjustmentValue,
            adjustmentUnit: rule.adjustmentUnit,
            discountAmount: currentPrice - ruleResult.newPrice,
            discountPercentage: ((currentPrice - ruleResult.newPrice) / currentPrice) * 100,
          })

          // Capturer l'étape détaillée si demandé
          if (options?.detailed) {
            breakdownSteps.push({
              stepNumber: ++stepNumber,
              ruleName: rule.ruleName,
              ruleId: rule.id,
              priceBefore: previousPrice,
              priceAfter: ruleResult.newPrice,
              adjustment: ruleResult.newPrice - previousPrice,
              adjustmentType: rule.adjustmentType,
              description: this.getStepDescription(rule, previousPrice, ruleResult.newPrice),
            })
          }

          currentPrice = ruleResult.newPrice

          // Incrémenter l'usage de la règle
          rule.incrementUsage(context.customerId)
          await this.priceRuleRepository.save(rule)

          // Si la règle n'est pas combinable, arrêter
          if (!rule.combinable) {
            break
          }
        }
      } catch (error) {
        this.logger.error(`Erreur application règle ${rule.id}:`, error)
        warnings.push(`Erreur règle ${rule.ruleName}`)
      }
    }

    // 4. Construire le résultat
    const finalPrice = Math.max(0, currentPrice)
    const totalDiscount = basePrice - finalPrice
    const calculationTime = Date.now() - startTime

    const result: PriceCalculationResult = {
      basePrice,
      finalPrice,
      currency: 'EUR',
      appliedRules,
      totalDiscount,
      totalDiscountPercentage: basePrice > 0 ? (totalDiscount / basePrice) * 100 : 0,
      unitPrice: article.uniteVente
        ? {
            value: finalPrice,
            unit: article.uniteVente,
          }
        : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    // Ajouter les détails si demandés
    if (options?.detailed) {
      result.breakdown = {
        steps: breakdownSteps,
        skippedRules: options.includeSkippedRules ? skippedRules : undefined,
        context: {
          article: {
            id: article.id,
            reference: article.reference,
            designation: article.designation,
            famille: article.famille,
            dimensions: {
              poids: article.poids,
              longueur: article.longueur,
              largeur: article.largeur,
              hauteur: article.hauteur,
              surface: article.surface,
              volume: article.volume,
            },
            units: {
              stock: article.uniteStock,
              vente: article.uniteVente,
              achat: article.uniteAchat,
            },
          },
          customer: {
            id: context.customerId,
            group: context.customerGroup,
            email: context.customerEmail,
          },
          quantity: context.quantity || 1,
          channel: context.channel || PriceRuleChannel.ERP,
        },
        metadata: {
          calculationTime,
          rulesEvaluated: allRules.length,
          rulesApplied: appliedRules.length,
          cacheHit: false,
        },
      }

      // Ajouter les marges si demandées
      if (options.includeMargins && article.prixAchatHT) {
        const costPrice = article.prixAchatHT * (article.coefficientAchat || 1)
        const margin = finalPrice - costPrice
        const marginPercentage = costPrice > 0 ? (margin / costPrice) * 100 : 0
        const markupPercentage = finalPrice > 0 ? (margin / finalPrice) * 100 : 0

        result.breakdown.margins = {
          costPrice,
          sellingPrice: finalPrice,
          margin,
          marginPercentage,
          markupPercentage,
        }
      }
    }

    return result
  }

  /**
   * Applique une règle de prix
   */
  private async applyRule(
    rule: PriceRule,
    currentPrice: number,
    article: PricingContext['article'],
    context: PricingContext
  ): Promise<{ newPrice: number }> {
    if (!article) {
      return { newPrice: currentPrice }
    }

    switch (rule.adjustmentType) {
      case AdjustmentType.PERCENTAGE:
        return { newPrice: currentPrice * (1 + rule.adjustmentValue / 100) }

      case AdjustmentType.FIXED_AMOUNT:
        return { newPrice: currentPrice + rule.adjustmentValue }

      case AdjustmentType.FIXED_PRICE:
        return { newPrice: rule.adjustmentValue }

      case AdjustmentType.PRICE_PER_WEIGHT:
        return this.calculateWeightBasedPrice(rule, article)

      case AdjustmentType.PRICE_PER_LENGTH:
        return this.calculateLengthBasedPrice(rule, article)

      case AdjustmentType.PRICE_PER_SURFACE:
        return this.calculateSurfaceBasedPrice(rule, article)

      case AdjustmentType.PRICE_PER_VOLUME:
        return this.calculateVolumeBasedPrice(rule, article)

      case AdjustmentType.FORMULA:
        return this.calculateFormulaBasedPrice(rule, currentPrice, article, context)

      default:
        return { newPrice: currentPrice }
    }
  }

  /**
   * Calcule le prix basé sur le poids
   */
  private calculateWeightBasedPrice(
    rule: PriceRule,
    article: PricingContext['article']
  ): { newPrice: number } {
    if (!article?.poids || !rule.adjustmentUnit) {
      return { newPrice: 0 }
    }

    // Le poids est généralement en kg dans la base
    const price = UnitConversionService.calculateWeightBasedPrice(
      article.poids,
      'KG',
      rule.adjustmentValue,
      rule.adjustmentUnit
    )

    return { newPrice: price || 0 }
  }

  /**
   * Calcule le prix basé sur la longueur
   */
  private calculateLengthBasedPrice(
    rule: PriceRule,
    article: PricingContext['article']
  ): { newPrice: number } {
    if (!article?.longueur || !rule.adjustmentUnit) {
      return { newPrice: 0 }
    }

    // La longueur est en mm dans la base
    const price = UnitConversionService.calculateLengthBasedPrice(
      article.longueur,
      'MM',
      rule.adjustmentValue,
      rule.adjustmentUnit
    )

    return { newPrice: price || 0 }
  }

  /**
   * Calcule le prix basé sur la surface
   */
  private calculateSurfaceBasedPrice(
    rule: PriceRule,
    article: PricingContext['article']
  ): { newPrice: number } {
    if (!rule.adjustmentUnit) {
      return { newPrice: 0 }
    }

    // Calculer la surface si pas déjà disponible
    let surface = article?.surface
    if (!surface && article?.longueur && article?.largeur) {
      surface = UnitConversionService.calculateSurface(article.longueur, article.largeur, 'MM')
    }

    if (!surface) {
      return { newPrice: 0 }
    }

    const price = UnitConversionService.calculateSurfaceBasedPrice(
      surface,
      'M2',
      rule.adjustmentValue,
      rule.adjustmentUnit
    )

    return { newPrice: price || 0 }
  }

  /**
   * Calcule le prix basé sur le volume
   */
  private calculateVolumeBasedPrice(
    rule: PriceRule,
    article: PricingContext['article']
  ): { newPrice: number } {
    if (!rule.adjustmentUnit) {
      return { newPrice: 0 }
    }

    // Calculer le volume si pas déjà disponible
    let volume = article?.volume
    if (!volume && article?.longueur && article?.largeur && article?.hauteur) {
      volume = UnitConversionService.calculateVolume(
        article.longueur,
        article.largeur,
        article.hauteur,
        'MM'
      )
    }

    if (!volume) {
      return { newPrice: 0 }
    }

    const price = UnitConversionService.calculateVolumeBasedPrice(
      volume,
      'M3',
      rule.adjustmentValue,
      rule.adjustmentUnit
    )

    return { newPrice: price || 0 }
  }

  /**
   * Calcule le prix basé sur une formule personnalisée
   */
  private calculateFormulaBasedPrice(
    rule: PriceRule,
    currentPrice: number,
    article: PricingContext['article'],
    context: PricingContext
  ): { newPrice: number } {
    if (!rule.formula) {
      return { newPrice: currentPrice }
    }

    try {
      // Préparer les variables pour la formule
      this.mathParser.set('basePrice', currentPrice)
      this.mathParser.set('price', currentPrice)
      this.mathParser.set('quantity', context.quantity || 1)
      this.mathParser.set('weight', article?.poids || 0)
      this.mathParser.set('length', article?.longueur || 0)
      this.mathParser.set('width', article?.largeur || 0)
      this.mathParser.set('height', article?.hauteur || 0)

      // Calculer la surface et le volume si possible
      if (article?.longueur && article?.largeur) {
        const surface = UnitConversionService.calculateSurface(
          article.longueur,
          article.largeur,
          'MM'
        )
        this.mathParser.set('surface', surface)

        if (article.hauteur) {
          const volume = UnitConversionService.calculateVolume(
            article.longueur,
            article.largeur,
            article.hauteur,
            'MM'
          )
          this.mathParser.set('volume', volume)
        }
      }

      // Évaluer la formule
      const result = this.mathParser.evaluate(rule.formula)

      if (typeof result === 'number' && !Number.isNaN(result)) {
        return { newPrice: Math.max(0, result) }
      }
    } catch (error) {
      this.logger.error(`Erreur évaluation formule: ${rule.formula}`, error)
    }

    return { newPrice: currentPrice }
  }

  /**
   * Génère une description pour une étape de calcul
   */
  private getStepDescription(rule: PriceRule, priceBefore: number, priceAfter: number): string {
    const diff = priceAfter - priceBefore
    const sign = diff >= 0 ? '+' : ''

    switch (rule.adjustmentType) {
      case AdjustmentType.PERCENTAGE:
        return `Application d'un ${rule.adjustmentValue >= 0 ? 'supplément' : 'remise'} de ${Math.abs(rule.adjustmentValue)}%`
      case AdjustmentType.FIXED_AMOUNT:
        return `Ajustement de ${sign}${diff.toFixed(2)}€`
      case AdjustmentType.FIXED_PRICE:
        return `Prix fixé à ${priceAfter.toFixed(2)}€`
      case AdjustmentType.PRICE_PER_WEIGHT:
        return `Tarification au poids: ${rule.adjustmentValue}€/${rule.adjustmentUnit}`
      case AdjustmentType.PRICE_PER_LENGTH:
        return `Tarification à la longueur: ${rule.adjustmentValue}€/${rule.adjustmentUnit}`
      case AdjustmentType.PRICE_PER_SURFACE:
        return `Tarification à la surface: ${rule.adjustmentValue}€/${rule.adjustmentUnit}`
      case AdjustmentType.PRICE_PER_VOLUME:
        return `Tarification au volume: ${rule.adjustmentValue}€/${rule.adjustmentUnit}`
      case AdjustmentType.FORMULA:
        return `Application de la formule personnalisée`
      default:
        return `Ajustement de prix appliqué`
    }
  }

  /**
   * Récupère toutes les règles pour évaluation (incluant celles qui seront skippées)
   */
  private async getAllRulesForEvaluation(
    article: PricingContext['article'],
    context: PricingContext
  ): Promise<PriceRule[]> {
    if (!article) return []

    // Construire la requête pour récupérer TOUTES les règles (actives et inactives)
    const query = this.priceRuleRepository
      .createQueryBuilder('rule')
      .where('rule.societeId = :societeId', { societeId: context.societeId })
      .andWhere('(rule.channel = :allChannel OR rule.channel = :channel)', {
        allChannel: PriceRuleChannel.ALL,
        channel: context.channel || PriceRuleChannel.ERP,
      })

    // Filtrer par article ou famille
    query.andWhere('(rule.articleId = :articleId OR rule.articleId IS NULL)', {
      articleId: article.id,
    })

    if (article.famille) {
      query.andWhere('(rule.articleFamily = :famille OR rule.articleFamily IS NULL)', {
        famille: article.famille,
      })
    }

    // Récupérer et trier par priorité
    return await query
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany()
  }

  /**
   * Récupère les règles applicables pour un article
   */
  private async getApplicableRules(
    article: PricingContext['article'],
    context: PricingContext
  ): Promise<PriceRule[]> {
    if (!article) return []

    // Construire la requête pour récupérer les règles
    const query = this.priceRuleRepository
      .createQueryBuilder('rule')
      .where('rule.societeId = :societeId', { societeId: context.societeId })
      .andWhere('rule.isActive = :isActive', { isActive: true })
      .andWhere('(rule.channel = :allChannel OR rule.channel = :channel)', {
        allChannel: PriceRuleChannel.ALL,
        channel: context.channel || PriceRuleChannel.ERP,
      })

    // Filtrer par article ou famille
    query.andWhere('(rule.articleId = :articleId OR rule.articleId IS NULL)', {
      articleId: article.id,
    })

    if (article.famille) {
      query.andWhere('(rule.articleFamily = :famille OR rule.articleFamily IS NULL)', {
        famille: article.famille,
      })
    }

    // Récupérer et trier par priorité
    const rules = await query
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany()

    // Filtrer les règles selon leurs conditions
    const enrichedContext = {
      ...context,
      article_reference: article.reference,
      article_family: article.famille,
      quantity: context.quantity || 1,
    }

    return rules.filter((rule) => rule.canBeApplied(enrichedContext))
  }

  /**
   * Récupère un article depuis la base
   */
  private async fetchArticle(
    articleId: string,
    articleReference?: string,
    societeId?: string
  ): Promise<PricingContext['article'] | null> {
    try {
      const query = this.articleRepository.createQueryBuilder('article')

      if (articleId) {
        query.where('article.id = :id', { id: articleId })
      } else if (articleReference) {
        query.where('article.reference = :reference', { reference: articleReference })
      } else {
        return null
      }

      if (societeId) {
        query.andWhere('article.societeId = :societeId', { societeId })
      }

      const article = await query.getOne()

      if (!article) return null

      return {
        id: article.id,
        reference: article.reference,
        designation: article.designation,
        famille: article.famille,
        prixVenteHT: Number(article.prixVenteHT) || 0,
        poids: Number(article.poids) || undefined,
        longueur: Number(article.longueur) || undefined,
        largeur: Number(article.largeur) || undefined,
        hauteur: Number(article.hauteur) || undefined,
        uniteStock: article.uniteStock,
        uniteVente: article.uniteVente,
        uniteAchat: article.uniteAchat,
        coefficientVente: Number(article.coefficientVente) || 1,
        coefficientAchat: Number(article.coefficientAchat) || 1,
      }
    } catch (error) {
      this.logger.error('Erreur récupération article:', error)
      return null
    }
  }

  /**
   * Crée un résultat vide avec warnings
   */
  private createEmptyResult(warnings: string[]): PriceCalculationResult {
    return {
      basePrice: 0,
      finalPrice: 0,
      currency: 'EUR',
      appliedRules: [],
      totalDiscount: 0,
      totalDiscountPercentage: 0,
      warnings,
    }
  }

  /**
   * Calcule les prix pour plusieurs articles
   */
  async calculateBulkPrices(
    articles: Array<{ articleId: string; quantity?: number }>,
    context: Omit<PricingContext, 'articleId' | 'quantity'>
  ): Promise<Map<string, PriceCalculationResult>> {
    const results = new Map<string, PriceCalculationResult>()

    for (const item of articles) {
      const result = await this.calculatePrice({
        ...context,
        articleId: item.articleId,
        quantity: item.quantity,
      })
      results.set(item.articleId, result)
    }

    return results
  }

  /**
   * Prévisualise l'application d'une règle
   */
  async previewRule(
    ruleId: string,
    articleId: string,
    context: Omit<PricingContext, 'articleId'>
  ): Promise<PriceCalculationResult> {
    const rule = await this.priceRuleRepository.findOne({
      where: { id: ruleId },
    })

    if (!rule) {
      return this.createEmptyResult(['Règle introuvable'])
    }

    // Désactiver temporairement toutes les autres règles pour le preview
    const _originalRules = await this.getApplicableRules({ id: articleId } as any, {
      ...context,
      articleId,
    })

    // Calculer avec seulement cette règle
    const article = await this.fetchArticle(articleId, undefined, context.societeId)
    if (!article) {
      return this.createEmptyResult(['Article introuvable'])
    }

    const basePrice = article.prixVenteHT || 0
    const ruleResult = await this.applyRule(rule, basePrice, article, context)

    return {
      basePrice,
      finalPrice: ruleResult.newPrice,
      currency: 'EUR',
      appliedRules: [
        {
          ruleId: rule.id,
          ruleName: rule.ruleName,
          ruleType: rule.adjustmentType,
          adjustment: rule.adjustmentValue,
          adjustmentUnit: rule.adjustmentUnit,
          discountAmount: basePrice - ruleResult.newPrice,
          discountPercentage: ((basePrice - ruleResult.newPrice) / basePrice) * 100,
        },
      ],
      totalDiscount: basePrice - ruleResult.newPrice,
      totalDiscountPercentage:
        basePrice > 0 ? ((basePrice - ruleResult.newPrice) / basePrice) * 100 : 0,
    }
  }
}
