import type { PriceRuleChannel } from '@erp/entities'
import type { HttpClient } from '../core/http-client'

export interface PricingRule {
  id: string
  name: string
  description?: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  priority: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PriceCalculationRequest {
  articleId?: string
  articleReference?: string
  article?: {
    id: string
    reference: string
    designation: string
    famille?: string
    prixVenteHT?: number
    poids?: number
    longueur?: number
    largeur?: number
    hauteur?: number
    uniteStock?: string
    uniteVente?: string
  }
  quantity?: number
  customerId?: string
  customerGroup?: string
  customerEmail?: string
  channel?: PriceRuleChannel
  promotionCode?: string
}

export interface PriceCalculationResult {
  basePrice: number
  finalPrice: number
  currency: string
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    ruleType: string
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
}

export interface BulkPriceRequest {
  articles: Array<{
    articleId: string
    quantity?: number
  }>
  customerId?: string
  customerGroup?: string
  channel?: PriceRuleChannel
}

export interface BulkPriceResult {
  results: Array<{
    articleId: string
    result: PriceCalculationResult
  }>
}

export class PricingApi {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Calcule le prix d'un article en appliquant les règles de prix
   */
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    const response = await this.httpClient.post<PriceCalculationResult>(
      '/pricing/calculate',
      request
    )
    return response.data
  }

  /**
   * Calcule les prix pour plusieurs articles en une seule requête
   */
  async calculateBulkPrices(request: BulkPriceRequest): Promise<BulkPriceResult> {
    const response = await this.httpClient.post<BulkPriceResult>('/pricing/calculate-bulk', request)
    return response.data
  }

  /**
   * Prévisualise l'application d'une règle de prix
   */
  async previewRule(
    ruleId: string,
    articleId: string,
    options?: {
      quantity?: number
      customerGroup?: string
      channel?: PriceRuleChannel
    }
  ): Promise<PriceCalculationResult> {
    const response = await this.httpClient.post<PriceCalculationResult>('/pricing/preview-rule', {
      ruleId,
      articleId,
      ...options,
    })
    return response.data
  }

  /**
   * Liste les règles de prix
   */
  async listRules(filters?: {
    active?: boolean
    channel?: PriceRuleChannel
    articleId?: string
    articleFamily?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ rules: PricingRule[]; total: number }> {
    const response = await this.httpClient.get<{ rules: PricingRule[]; total: number }>(
      '/pricing/rules',
      {
        params: filters,
      }
    )
    return response.data
  }

  /**
   * Récupère une règle de prix spécifique
   */
  async getRule(ruleId: string): Promise<PricingRule> {
    const response = await this.httpClient.get<PricingRule>(`/pricing/rules/${ruleId}`)
    return response.data
  }

  /**
   * Crée une nouvelle règle de prix (admin only)
   */
  async createRule(rule: Partial<PricingRule>): Promise<PricingRule> {
    const response = await this.httpClient.post<PricingRule>('/pricing/rules', rule)
    return response.data
  }

  /**
   * Met à jour une règle de prix (admin only)
   */
  async updateRule(ruleId: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const response = await this.httpClient.put<PricingRule>(`/pricing/rules/${ruleId}`, updates)
    return response.data
  }

  /**
   * Supprime une règle de prix (admin only)
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.httpClient.delete(`/pricing/rules/${ruleId}`)
  }

  /**
   * Active/désactive une règle de prix
   */
  async toggleRule(ruleId: string): Promise<{ id: string; isActive: boolean }> {
    const response = await this.httpClient.post<{ id: string; isActive: boolean }>(
      `/pricing/rules/${ruleId}/toggle`,
      {}
    )
    return response.data
  }
}
