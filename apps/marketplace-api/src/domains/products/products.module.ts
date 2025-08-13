import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantModule } from '../../shared/tenant/tenant.module'
import { ProductsController } from './controllers/products.controller'
import { MarketplaceProduct } from './entities/marketplace-product.entity'
import { MarketplaceProductsService } from './services/marketplace-products.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceProduct], 'marketplace'),
    HttpModule,
    TenantModule,
  ],
  providers: [MarketplaceProductsService],
  controllers: [ProductsController],
  exports: [MarketplaceProductsService],
})
export class ProductsModule {}
