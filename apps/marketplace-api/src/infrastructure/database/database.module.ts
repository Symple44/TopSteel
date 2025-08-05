import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
// Entités Marketplace
import { MarketplaceCustomer } from '../../domains/customers/entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../../domains/orders/entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../../domains/orders/entities/marketplace-order-item.entity'
import { PageSection, PageTemplate, SectionPreset } from '../../domains/page-builder/entities'
import { MarketplacePriceRule } from '../../domains/products/entities/marketplace-price-rule.entity'
import { MarketplaceProduct } from '../../domains/products/entities/marketplace-product.entity'
import { MarketplaceTheme } from '../../domains/themes/entities/marketplace-theme.entity'
import { Article } from '../../shared/entities/erp/article.entity'
// Entités ERP (lecture seule)
import { Societe } from '../../shared/entities/erp/societe.entity'

@Module({
  imports: [
    // Base ERP Auth (lecture seule)
    TypeOrmModule.forRootAsync({
      name: 'erpAuth',
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database.erpAuth')
        return {
          ...dbConfig,
          entities: [Societe],
        }
      },
      inject: [ConfigService],
    }),

    // Base Marketplace (lecture/écriture)
    TypeOrmModule.forRootAsync({
      name: 'marketplace',
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database.marketplace')
        return {
          ...dbConfig,
          entities: [
            MarketplaceCustomer,
            MarketplaceProduct,
            MarketplacePriceRule,
            MarketplaceOrder,
            MarketplaceOrderItem,
            MarketplaceTheme,
            PageTemplate,
            PageSection,
            SectionPreset,
          ],
        }
      },
      inject: [ConfigService],
    }),

    // Exports pour les autres modules
    TypeOrmModule.forFeature([Societe], 'erpAuth'),
    TypeOrmModule.forFeature(
      [
        MarketplaceCustomer,
        MarketplaceProduct,
        MarketplacePriceRule,
        MarketplaceOrder,
        MarketplaceOrderItem,
        MarketplaceTheme,
        PageTemplate,
        PageSection,
        SectionPreset,
      ],
      'marketplace'
    ),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
