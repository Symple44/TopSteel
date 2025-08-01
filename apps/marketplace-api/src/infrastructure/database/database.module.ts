import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'

// Entités ERP (lecture seule)
import { Societe } from '../../shared/entities/erp/societe.entity'
import { Article } from '../../shared/entities/erp/article.entity'

// Entités Marketplace
import { MarketplaceCustomer } from '../../domains/customers/entities/marketplace-customer.entity'
import { MarketplaceProduct } from '../../domains/products/entities/marketplace-product.entity'
import { MarketplacePriceRule } from '../../domains/products/entities/marketplace-price-rule.entity'
import { MarketplaceOrder } from '../../domains/orders/entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../../domains/orders/entities/marketplace-order-item.entity'
import { MarketplaceTheme } from '../../domains/themes/entities/marketplace-theme.entity'

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
          ],
        }
      },
      inject: [ConfigService],
    }),

    // Exports pour les autres modules
    TypeOrmModule.forFeature([Societe], 'erpAuth'),
    TypeOrmModule.forFeature([
      MarketplaceCustomer,
      MarketplaceProduct,
      MarketplacePriceRule,
      MarketplaceOrder,
      MarketplaceOrderItem,
      MarketplaceTheme,
    ], 'marketplace'),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}