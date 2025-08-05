import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductsController } from './controllers/products.controller'
import { MarketplacePriceRule } from './entities/marketplace-price-rule.entity'
import { MarketplaceProduct } from './entities/marketplace-product.entity'
import { MarketplacePricingEngine } from './services/marketplace-pricing-engine.service'
import { MarketplaceProductsService } from './services/marketplace-products.service'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceProduct, MarketplacePriceRule], 'marketplace')],
  providers: [MarketplaceProductsService, MarketplacePricingEngine],
  controllers: [ProductsController],
  exports: [MarketplaceProductsService, MarketplacePricingEngine],
})
export class ProductsModule {}
