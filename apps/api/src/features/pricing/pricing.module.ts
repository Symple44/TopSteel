/**
 * ⚠️  MODULE LEGACY - Remplacé par PricingUnifiedModule
 * 
 * Ce module est conservé pour compatibilité mais sera supprimé.
 * Utilisez PricingUnifiedModule à la place.
 * 
 * @deprecated Utilisez PricingUnifiedModule
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PriceRule } from '@erp/entities'
import { Article } from '../../domains/inventory/entities/article.entity'
import { PricingEngineService } from './services/pricing-engine.service'
import { PricingController } from './controllers/pricing.controller'
import { PriceRulesController } from './controllers/price-rules.controller'
import { PricingQuoteController } from './controllers/pricing-quote.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceRule, Article], 'tenant')
  ],
  providers: [PricingEngineService],
  controllers: [PricingController, PriceRulesController, PricingQuoteController],
  exports: [PricingEngineService]
})
export class PricingModule {
  // Note: This module is deprecated. Use PricingUnifiedModule instead.
}