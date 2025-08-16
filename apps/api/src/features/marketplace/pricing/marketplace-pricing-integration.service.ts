import { Injectable, Logger } from '@nestjs/common';
import { PricingEngineService, PricingContext, PriceCalculationResult } from '../../pricing/services/pricing-engine.service';
import { PriceRuleChannel } from '@erp/entities';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

export interface MarketplacePricingOptions {
  quantity: number;
  customerId?: string;
  customerGroup?: string;
  promotionCode?: string;
  isFirstOrder?: boolean;
  orderTotal?: number;
  channel?: 'WEB' | 'MOBILE' | 'API';
}

export interface MarketplacePriceResult extends PriceCalculationResult {
  displayPrice: number; // Prix affiché (TTC ou HT selon config)
  originalPrice?: number; // Prix barré si promotion
  savings?: number; // Économies réalisées
  taxAmount?: number; // Montant TVA
  shippingCost?: number; // Frais de port calculés
  totalWithShipping?: number; // Total avec frais de port
}

@Injectable()
export class MarketplacePricingIntegrationService {
  private readonly logger = new Logger(MarketplacePricingIntegrationService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly TVA_RATE = 0.20; // 20% TVA par défaut

  constructor(
    private readonly pricingEngine: PricingEngineService,
    @InjectRedis() private readonly redis: Redis
  ) {}

  /**
   * Calcule le prix d'un article pour le marketplace avec toutes les règles applicables
   */
  async calculateMarketplacePrice(
    articleId: string,
    tenantId: string,
    options: MarketplacePricingOptions
  ): Promise<MarketplacePriceResult> {
    const cacheKey = this.getCacheKey(articleId, tenantId, options);
    
    // Vérifier le cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Préparer le contexte de pricing
      const pricingContext: PricingContext = {
        articleId,
        societeId: tenantId,
        quantity: options.quantity,
        customerId: options.customerId,
        customerGroup: options.customerGroup,
        channel: PriceRuleChannel.MARKETPLACE,
        promotionCode: options.promotionCode,
        isFirstOrder: options.isFirstOrder,
        orderTotal: options.orderTotal
      };

      // Calculer avec le moteur de pricing ERP
      const erpResult = await this.pricingEngine.calculatePrice(pricingContext, {
        detailed: true,
        includeMargins: true
      });

      // Enrichir avec les données marketplace
      const result = this.enrichWithMarketplaceData(erpResult, options);

      // Mettre en cache
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      this.logger.error(`Failed to calculate marketplace price for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule les prix pour plusieurs articles (panier)
   */
  async calculateBulkPrices(
    items: Array<{ articleId: string; quantity: number; customizations?: any }>,
    tenantId: string,
    customerId?: string
  ): Promise<Map<string, MarketplacePriceResult>> {
    const results = new Map<string, MarketplacePriceResult>();

    // Calculer le total provisoire pour les règles basées sur le montant total
    const provisionalTotal = await this.calculateProvisionalTotal(items, tenantId);

    // Calculer chaque article avec le contexte du panier
    for (const item of items) {
      const price = await this.calculateMarketplacePrice(item.articleId, tenantId, {
        quantity: item.quantity,
        customerId,
        orderTotal: provisionalTotal
      });
      results.set(item.articleId, price);
    }

    return results;
  }

  /**
   * Calcule les frais de port selon les règles définies
   */
  async calculateShippingCost(
    items: Array<{ articleId: string; quantity: number; weight?: number }>,
    destinationPostalCode: string,
    tenantId: string
  ): Promise<number> {
    // Logique de calcul des frais de port
    // Peut être basée sur le poids, le volume, la distance, etc.
    let totalWeight = 0;
    let totalValue = 0;

    for (const item of items) {
      totalWeight += (item.weight || 0) * item.quantity;
      const price = await this.calculateMarketplacePrice(item.articleId, tenantId, {
        quantity: item.quantity
      });
      totalValue += price.finalPrice;
    }

    // Frais de port gratuits au-dessus d'un certain montant
    if (totalValue >= 500) {
      return 0;
    }

    // Calcul basé sur le poids
    if (totalWeight <= 5) {
      return 9.90; // Forfait petit colis
    } else if (totalWeight <= 30) {
      return 19.90; // Forfait moyen
    } else {
      return 29.90 + (totalWeight - 30) * 0.50; // Forfait + supplément
    }
  }

  /**
   * Applique une promotion ou un code promo
   */
  async applyPromotionCode(
    code: string,
    currentPrice: number,
    articleId: string,
    tenantId: string
  ): Promise<{ 
    success: boolean; 
    newPrice?: number; 
    discount?: number; 
    message?: string 
  }> {
    // Vérifier la validité du code promo
    const promoRule = await this.validatePromotionCode(code, articleId, tenantId);
    
    if (!promoRule) {
      return { 
        success: false, 
        message: 'Code promo invalide ou expiré' 
      };
    }

    // Appliquer la réduction
    const discount = this.calculatePromoDiscount(currentPrice, promoRule);
    const newPrice = currentPrice - discount;

    return {
      success: true,
      newPrice,
      discount,
      message: `Code promo ${code} appliqué avec succès`
    };
  }

  /**
   * Enrichit les résultats ERP avec des données spécifiques marketplace
   */
  private enrichWithMarketplaceData(
    erpResult: PriceCalculationResult,
    options: MarketplacePricingOptions
  ): MarketplacePriceResult {
    const taxAmount = erpResult.finalPrice * this.TVA_RATE;
    const displayPrice = erpResult.finalPrice * (1 + this.TVA_RATE); // Prix TTC

    const result: MarketplacePriceResult = {
      ...erpResult,
      displayPrice,
      taxAmount,
      totalWithShipping: displayPrice // Sera mis à jour avec les frais de port
    };

    // Si des règles ont été appliquées, calculer les économies
    if (erpResult.appliedRules && erpResult.appliedRules.length > 0) {
      result.originalPrice = erpResult.basePrice * (1 + this.TVA_RATE);
      result.savings = result.originalPrice - result.displayPrice;
    }

    return result;
  }

  /**
   * Génère une clé de cache unique
   */
  private getCacheKey(
    articleId: string,
    tenantId: string,
    options: MarketplacePricingOptions
  ): string {
    const key = [
      'marketplace-price',
      tenantId,
      articleId,
      options.quantity,
      options.customerId || 'anonymous',
      options.customerGroup || 'default',
      options.promotionCode || 'none'
    ].join(':');
    
    return key;
  }

  /**
   * Calcule un total provisoire pour les règles basées sur le montant
   */
  private async calculateProvisionalTotal(
    items: Array<{ articleId: string; quantity: number }>,
    tenantId: string
  ): Promise<number> {
    let total = 0;
    
    for (const item of items) {
      // Calcul simple sans règles complexes pour éviter la récursion
      const context: PricingContext = {
        articleId: item.articleId,
        quantity: item.quantity,
        societeId: tenantId,
        channel: PriceRuleChannel.MARKETPLACE
      };
      
      const result = await this.pricingEngine.calculatePrice(context);
      total += result.finalPrice;
    }
    
    return total;
  }

  /**
   * Valide un code promo
   */
  private async validatePromotionCode(
    code: string,
    articleId: string,
    tenantId: string
  ): Promise<{ type: 'percentage' | 'fixed'; value: number } | null> {
    // Implémentation simplifiée - à remplacer par une vraie table promotions
    const promotions: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
      'SUMMER2024': { type: 'percentage', value: 15 },
      'WELCOME10': { type: 'percentage', value: 10 },
      'FIRSTORDER': { type: 'fixed', value: 20 }
    };

    const promo = promotions[code.toUpperCase()];
    return promo || null;
  }

  /**
   * Calcule la réduction d'un code promo
   */
  private calculatePromoDiscount(price: number, promoRule: { type: 'percentage' | 'fixed'; value: number }): number {
    if (promoRule.type === 'percentage') {
      return price * (promoRule.value / 100);
    } else if (promoRule.type === 'fixed') {
      return Math.min(promoRule.value, price); // Ne pas dépasser le prix
    }
    return 0;
  }

  /**
   * Invalide le cache pour un article
   */
  async invalidateCache(articleId: string, tenantId: string): Promise<void> {
    const pattern = `marketplace-price:${tenantId}:${articleId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Invalidated ${keys.length} cache entries for article ${articleId}`);
    }
  }

  /**
   * Invalide tout le cache d'un tenant
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    const pattern = `marketplace-price:${tenantId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.log(`Invalidated ${keys.length} cache entries for tenant ${tenantId}`);
    }
  }
}