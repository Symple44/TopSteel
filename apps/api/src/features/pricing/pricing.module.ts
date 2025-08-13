/**
 * ⚠️  MODULE LEGACY - Remplacé par PricingUnifiedModule
 *
 * Ce module est conservé pour compatibilité mais sera supprimé.
 * Utilisez PricingUnifiedModule à la place.
 *
 * @deprecated Utilisez PricingUnifiedModule
 */

import { PriceRule } from '@erp/entities'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article } from '../../domains/inventory/entities/article.entity'
import { PriceRulesController } from './controllers/price-rules.controller'
import { PricingController } from './controllers/pricing.controller'
import { PricingQuoteController } from './controllers/pricing-quote.controller'
import { PricingEngineService } from './services/pricing-engine.service'

@Module({
  imports: [TypeOrmModule.forFeature([PriceRule, Article], 'tenant')],
  providers: [PricingEngineService],
  controllers: [PricingController, PriceRulesController, PricingQuoteController],
  exports: [PricingEngineService],
})
export class PricingModule {
  // Note: This module is deprecated. Use PricingUnifiedModule instead.
}
