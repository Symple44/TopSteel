import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '@erp/entities';
import { Partner } from '../../../domains/partners/entities/partner.entity';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity';
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity';

// Adapters
import { MarketplaceProductAdapter } from '../adapters/marketplace-product.adapter';
import { MarketplaceCustomerAdapter } from '../adapters/marketplace-customer.adapter';
import { MarketplaceOrderAdapter } from '../adapters/marketplace-order.adapter';

// Integration Service
import { ERPMarketplaceIntegrationService } from './erp-marketplace-integration.service';

/**
 * Module d'intégration ERP-Marketplace
 * Fournit les adapters et services pour synchroniser les données
 * entre le système ERP et le marketplace
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Entités ERP
      Article,
      Partner,
      
      // Entités Marketplace
      MarketplaceOrder,
      MarketplaceOrderItem,
      MarketplaceCustomer,
    ]),
  ],
  providers: [
    // Adapters
    MarketplaceProductAdapter,
    MarketplaceCustomerAdapter,
    MarketplaceOrderAdapter,
    
    // Integration Service
    ERPMarketplaceIntegrationService,
  ],
  exports: [
    // Adapters
    MarketplaceProductAdapter,
    MarketplaceCustomerAdapter,
    MarketplaceOrderAdapter,
    
    // Integration Service
    ERPMarketplaceIntegrationService,
  ],
})
export class ERPIntegrationModule {}