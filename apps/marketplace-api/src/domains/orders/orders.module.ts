import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketplaceOrder } from './entities/marketplace-order.entity'
import { MarketplaceOrderItem } from './entities/marketplace-order-item.entity'

// TODO: Implémenter services et contrôleurs orders
// import { MarketplaceOrdersService } from './services/marketplace-orders.service'
// import { OrdersController } from './controllers/orders.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceOrder,
      MarketplaceOrderItem,
    ], 'marketplace'),
  ],
  providers: [
    // MarketplaceOrdersService,
  ],
  controllers: [
    // OrdersController,
  ],
  exports: [
    // MarketplaceOrdersService,
  ],
})
export class OrdersModule {}