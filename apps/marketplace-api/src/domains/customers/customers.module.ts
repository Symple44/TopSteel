import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantModule } from '../../shared/tenant/tenant.module'
import { EmailModule } from '../email/email.module'
import { CustomersController } from './controllers/customers.controller'
import { MarketplaceCustomer } from './entities/marketplace-customer.entity'
import { MarketplaceCustomersService } from './services/marketplace-customers.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceCustomer], 'marketplace'),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'marketplace-secret-key',
      signOptions: { expiresIn: '15m' }
    }),
    TenantModule,
    EmailModule,
  ],
  providers: [MarketplaceCustomersService],
  controllers: [CustomersController],
  exports: [MarketplaceCustomersService],
})
export class CustomersModule {}
