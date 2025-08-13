import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantModule } from '../../shared/tenant/tenant.module'
import { CustomersController } from './controllers/customers.controller'
import { MarketplaceCustomer } from './entities/marketplace-customer.entity'
import { MarketplaceCustomersService } from './services/marketplace-customers.service'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceCustomer], 'marketplace'), TenantModule],
  providers: [MarketplaceCustomersService],
  controllers: [CustomersController],
  exports: [MarketplaceCustomersService],
})
export class CustomersModule {}
