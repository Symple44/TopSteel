import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Societe } from '../../shared/entities/erp/societe.entity'
import { MarketplaceTheme } from '../themes/entities/marketplace-theme.entity'

import { StorefrontService } from './services/storefront.service'
import { StorefrontController } from './controllers/storefront.controller'

// Import other services needed
import { ProductsModule } from '../products/products.module'
import { CustomersModule } from '../customers/customers.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Societe], 'erpAuth'),
    TypeOrmModule.forFeature([MarketplaceTheme], 'marketplace'),
    ProductsModule,
    CustomersModule,
  ],
  providers: [StorefrontService],
  controllers: [StorefrontController],
  exports: [StorefrontService],
})
export class StorefrontModule {}
