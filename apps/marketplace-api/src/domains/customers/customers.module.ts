import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketplaceCustomer } from './entities/marketplace-customer.entity'
import { MarketplaceCustomersService } from './services/marketplace-customers.service'
import { CustomersController } from './controllers/customers.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceCustomer], 'marketplace')],
  providers: [MarketplaceCustomersService],
  controllers: [CustomersController],
  exports: [MarketplaceCustomersService],
})
export class CustomersModule {}
