import { AdjustmentType, Article, PriceRule, PriceRuleChannel } from '@erp/entities'
import { UnitConversionService } from '@erp/utils'
import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import * as mathjs from 'mathjs'
import type { DataSource, Repository } from 'typeorm'
import type {
  AppliedRuleInfo,
  BreakdownContext,
  BreakdownStep,
  BuildDetailedBreakdownParams,
  BuildFinalResultParams,
  CalculationState,
  DetailedBreakdown,
  EnrichedPricingContext,
  FormulaPriceResult,
  LengthPriceResult,
  PriceRuleApplication,
  PricingContext,
  SkippedRule,
  SurfacePriceResult,
  VolumePriceResult,
  WeightPriceResult,
} from '../types/pricing-engine.types'

export type { PricingContext } from '../types/pricing-engine.types'

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
   * Cognitive Complexity: Reduced from ~45 to ~8
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
    const calculationState = this.initializeCalculationState()

    // Early returns for validation
    const article = await this.resolveArticle(context)
    if (!article) {
      return this.createEmptyResult(['Article non trouvé ou non spécifié'])
    }

    // Apply coefficient and get base price
    const basePrice = this.applySellingCoefficient(article, calculationState, options)

    // Process rules
    const { applicableRules, skippedRules } = await this.processRules(article, context, options)
    const { finalPrice, appliedRules } = await this.applyRules(
      applicableRules,
      basePrice,
      article,
      context,
      calculationState,
      options
    )

    // Build and return result
    return this.buildFinalResult({
      article,
      context,
      options,
      basePrice,
      finalPrice,
      appliedRules,
      skippedRules,
      calculationTime: Date.now() - startTime,
      calculationState,
    })
  }

  /**
   * Initialize calculation state to track progress
   */
  private initializeCalculationState(): CalculationState {
    return {
      warnings: [] as string[],
      breakdownSteps: [] as BreakdownStep[],
      stepNumber: 0,
    }
  }

  /**
   * Resolve article from context with early return pattern
   */
  private async resolveArticle(context: PricingContext): Promise<PricingContext['article'] | null> {
    if (context.article) {
      return context.article
    }

    if (!context.articleId && !context.articleReference) {
      return null
    }

    return await this.fetchArticle(
      context.articleId || '',
      context.articleReference,
      context.societeId
    )
  }

  /**
   * Apply selling coefficient with single responsibility
   */
  private applySellingCoefficient(
    article: NonNullable<PricingContext['article']>,
    state: CalculationState,
    options?: { detailed?: boolean }
  ): number {
    let basePrice = article.prixVenteHT || 0

    if (!this.shouldApplyCoefficient(article.coefficientVente)) {
      return basePrice
    }

    const previousPrice = basePrice
    basePrice = basePrice * article.coefficientVente!

    this.logger.log(
      `Coefficient de vente appliqué: ${article.coefficientVente} -> Prix ajusté: ${basePrice}€`
    )

    if (options?.detailed) {
      this.addCoefficientBreakdownStep(state, previousPrice, basePrice, article.coefficientVente!)
    }

    return basePrice
  }

  /**
   * Guard clause for coefficient application
   */
  private shouldApplyCoefficient(coefficient?: number): boolean {
    return coefficient !== undefined && coefficient !== 1
  }

  /**
   * Add coefficient breakdown step
   */
  private addCoefficientBreakdownStep(
    state: CalculationState,
    previousPrice: number,
    newPrice: number,
    coefficient: number
  ): void {
    state.breakdownSteps.push({
      stepNumber: ++state.stepNumber,
      ruleName: 'Coefficient de vente',
      ruleId: 'coefficient',
      priceBefore: previousPrice,
      priceAfter: newPrice,
      adjustment: newPrice - previousPrice,
      adjustmentType: 'COEFFICIENT',
      description: `Application du coefficient de vente ${coefficient}`,
    })
  }

  /**
   * Process all rules and separate applicable from skipped
   */
  private async processRules(
    article: NonNullable<PricingContext['article']>,
    context: PricingContext,
    options?: { includeSkippedRules?: boolean }
  ): Promise<{ applicableRules: PriceRule[]; skippedRules: SkippedRule[] }> {
    const allRules = await this.getAllRulesForEvaluation(article, context)
    const enrichedContext = this.createEnrichedContext(context, article)

    return allRules.reduce(
      (acc, rule) => {
        if (rule.canBeApplied(enrichedContext)) {
          acc.applicableRules.push(rule)
        } else if (options?.includeSkippedRules) {
          acc.skippedRules.push(this.createSkippedRuleInfo(rule))
        }
        return acc
      },
      { applicableRules: [] as PriceRule[], skippedRules: [] as SkippedRule[] }
    )
  }

  /**
   * Create enriched context for rule evaluation
   */
  private createEnrichedContext(
    context: PricingContext,
    article: NonNullable<PricingContext['article']>
  ): EnrichedPricingContext {
    return {
      ...context,
      article_reference: article.reference,
      article_family: article.famille,
      quantity: context.quantity || 1,
    }
  }

  /**
   * Create skipped rule information
   */
  private createSkippedRuleInfo(rule: PriceRule): SkippedRule {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      reason: this.determineSkipReason(rule),
      priority: rule.priority,
    }
  }

  /**
   * Determine why a rule was skipped
   */
  private determineSkipReason(rule: PriceRule): string {
    const now = new Date()

    if (rule.validFrom && new Date(rule.validFrom) > now) {
      return 'Règle pas encore valide'
    }
    if (rule.validUntil && new Date(rule.validUntil) < now) {
      return 'Règle expirée'
    }
    if (rule.usageLimit && rule.usageCount >= rule.usageLimit) {
      return "Limite d'utilisation atteinte"
    }
    if (!rule.isActive) {
      return 'Règle inactive'
    }
    return 'Conditions non remplies'
  }

  /**
   * Apply rules sequentially with proper error handling
   */
  private async applyRules(
    rules: PriceRule[],
    startPrice: number,
    article: NonNullable<PricingContext['article']>,
    context: PricingContext,
    state: CalculationState,
    options?: { detailed?: boolean }
  ): Promise<{ finalPrice: number; appliedRules: AppliedRuleInfo[] }> {
    let currentPrice = startPrice
    const appliedRules: AppliedRuleInfo[] = []

    for (const rule of rules) {
      const ruleApplication = await this.safeApplyRule(rule, currentPrice, article, context)

      if (!ruleApplication.success) {
        state.warnings.push(`Erreur règle ${rule.ruleName}`)
        continue
      }

      if (ruleApplication.priceChanged) {
        const appliedRule = this.createAppliedRuleInfo(rule, currentPrice, ruleApplication.newPrice)
        appliedRules.push(appliedRule)

        if (options?.detailed) {
          this.addRuleBreakdownStep(state, rule, currentPrice, ruleApplication.newPrice)
        }

        currentPrice = ruleApplication.newPrice
        await this.updateRuleUsage(rule, context.customerId)

        // Early exit for non-combinable rules
        if (!rule.combinable) {
          break
        }
      }
    }

    return { finalPrice: Math.max(0, currentPrice), appliedRules }
  }

  /**
   * Safely apply a rule with error handling
   */
  private async safeApplyRule(
    rule: PriceRule,
    currentPrice: number,
    article: NonNullable<PricingContext['article']>,
    context: PricingContext
  ): Promise<PriceRuleApplication> {
    try {
      const result = await this.applyRule(rule, currentPrice, article, context)
      return {
        success: true,
        newPrice: result.newPrice,
        priceChanged: result.newPrice !== currentPrice,
      }
    } catch (error) {
      this.logger.error(`Erreur application règle ${rule.id}:`, error)
      return {
        success: false,
        newPrice: currentPrice,
        priceChanged: false,
      }
    }
  }

  /**
   * Create applied rule information
   */
  private createAppliedRuleInfo(
    rule: PriceRule,
    currentPrice: number,
    newPrice: number
  ): AppliedRuleInfo {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      ruleType: rule.adjustmentType,
      adjustment: rule.adjustmentValue,
      adjustmentUnit: rule.adjustmentUnit,
      discountAmount: currentPrice - newPrice,
      discountPercentage: ((currentPrice - newPrice) / currentPrice) * 100,
    }
  }

  /**
   * Add rule breakdown step
   */
  private addRuleBreakdownStep(
    state: CalculationState,
    rule: PriceRule,
    previousPrice: number,
    newPrice: number
  ): void {
    state.breakdownSteps.push({
      stepNumber: ++state.stepNumber,
      ruleName: rule.ruleName,
      ruleId: rule.id,
      priceBefore: previousPrice,
      priceAfter: newPrice,
      adjustment: newPrice - previousPrice,
      adjustmentType: rule.adjustmentType,
      description: this.getStepDescription(rule, previousPrice, newPrice),
    })
  }

  /**
   * Update rule usage
   */
  private async updateRuleUsage(rule: PriceRule, customerId?: string): Promise<void> {
    rule.incrementUsage(customerId)
    await this.priceRuleRepository.save(rule)
  }

  /**
   * Build the final result with all details
   */
  private buildFinalResult(params: BuildFinalResultParams): PriceCalculationResult {
    const { article, options, basePrice, finalPrice, appliedRules, calculationState } = params
    const totalDiscount = basePrice - finalPrice

    const result: PriceCalculationResult = {
      basePrice,
      finalPrice,
      currency: 'EUR',
      appliedRules,
      totalDiscount,
      totalDiscountPercentage: basePrice > 0 ? (totalDiscount / basePrice) * 100 : 0,
      unitPrice: article.uniteVente ? { value: finalPrice, unit: article.uniteVente } : undefined,
      warnings: calculationState.warnings.length > 0 ? calculationState.warnings : undefined,
    }

    if (options?.detailed) {
      result.breakdown = this.buildDetailedBreakdown(params)
    }

    return result
  }

  /**
   * Build detailed breakdown
   */
  private buildDetailedBreakdown(params: BuildDetailedBreakdownParams): DetailedBreakdown {
    const {
      article,
      context,
      options,
      finalPrice,
      skippedRules,
      appliedRules,
      calculationTime,
      calculationState,
    } = params

    const breakdown: DetailedBreakdown = {
      steps: calculationState.breakdownSteps,
      skippedRules: options?.includeSkippedRules ? skippedRules : undefined,
      context: this.buildBreakdownContext(article, context),
      metadata: {
        calculationTime,
        rulesEvaluated: skippedRules.length + appliedRules.length,
        rulesApplied: appliedRules.length,
        cacheHit: false,
      },
    }

    if (options?.includeMargins && article.prixAchatHT) {
      breakdown.margins = this.calculateMargins(article, finalPrice)
    }

    return breakdown
  }

  /**
   * Build breakdown context
   */
  private buildBreakdownContext(
    article: NonNullable<PricingContext['article']>,
    context: PricingContext
  ): BreakdownContext {
    return {
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
    }
  }

  /**
   * Calculate margins
   */
  private calculateMargins(article: NonNullable<PricingContext['article']>, finalPrice: number) {
    const costPrice = article.prixAchatHT! * (article.coefficientAchat || 1)
    const margin = finalPrice - costPrice
    const marginPercentage = costPrice > 0 ? (margin / costPrice) * 100 : 0
    const markupPercentage = finalPrice > 0 ? (margin / finalPrice) * 100 : 0

    return {
      costPrice,
      sellingPrice: finalPrice,
      margin,
      marginPercentage,
      markupPercentage,
    }
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
  ): WeightPriceResult {
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
  ): LengthPriceResult {
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
  ): SurfacePriceResult {
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
  ): VolumePriceResult {
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
  ): FormulaPriceResult {
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
    const enrichedContext: EnrichedPricingContext = {
      ...context,
      article_reference: article.reference,
      article_family: article.famille as string | undefined,
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
        prixAchatHT: Number(article.prixAchatStandard || article.prixAchatMoyen) || undefined,
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
    const _originalRules = await this.getApplicableRules(
      { id: articleId } as PricingContext['article'],
      {
        ...context,
        articleId,
      }
    )

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
