import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketplaceProduct } from './entities/marketplace-product.entity'
import { MarketplacePriceRule } from './entities/marketplace-price-rule.entity'

import { MarketplaceProductsService } from './services/marketplace-products.service'
import { MarketplacePricingEngine } from './services/marketplace-pricing-engine.service'

import { ProductsController } from './controllers/products.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceProduct,
      MarketplacePriceRule,
    ], 'marketplace'),
  ],
  providers: [
    MarketplaceProductsService,
    MarketplacePricingEngine,
  ],
  controllers: [
    ProductsController,
  ],
  exports: [
    MarketplaceProductsService,
    MarketplacePricingEngine,
  ],
})
export class ProductsModule {}