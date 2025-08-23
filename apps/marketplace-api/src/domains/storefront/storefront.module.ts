import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Societe } from '../../shared/entities/erp/societe.entity'
import { TenantModule } from '../../shared/tenant/tenant.module'
import { CustomersModule } from '../customers/customers.module'
import { EmailModule } from '../email/email.module'
// Import other services needed
import { ProductsModule } from '../products/products.module'
import { MarketplaceTheme } from '../themes/entities/marketplace-theme.entity'
import { StorefrontController } from './controllers/storefront.controller'
import { NewsletterSubscription } from './entities/newsletter-subscription.entity'
import { StorefrontService } from './services/storefront.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Societe], 'erpAuth'),
    TypeOrmModule.forFeature([MarketplaceTheme, NewsletterSubscription], 'marketplace'),
    TenantModule,
    ProductsModule,
    CustomersModule,
    EmailModule,
  ],
  providers: [StorefrontService],
  controllers: [StorefrontController],
  exports: [StorefrontService],
})
export class StorefrontModule {}
