import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MarketplaceCustomer } from '../customers/entities/marketplace-customer.entity'
import { OrdersController } from './controllers/orders.controller'
import { MarketplaceOrder } from './entities/marketplace-order.entity'
import { MarketplaceOrderItem } from './entities/marketplace-order-item.entity'
import { OrdersService } from './services/orders.service'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [MarketplaceOrder, MarketplaceOrderItem, MarketplaceCustomer],
      'marketplace'
    ),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
