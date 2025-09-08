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
      secret: (() => {
        const secret = process.env.JWT_SECRET
        const isProduction = process.env.NODE_ENV === 'production'

        if (isProduction && !secret) {
          throw new Error('JWT_SECRET environment variable is required in production')
        }

        if (secret && secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long')
        }

        // Use a development default only in non-production environments
        return secret || (isProduction ? undefined : 'customers-dev-jwt-secret-min-32-characters')
      })(),
      signOptions: { expiresIn: '15m' },
    }),
    TenantModule,
    EmailModule,
  ],
  providers: [MarketplaceCustomersService],
  controllers: [CustomersController],
  exports: [MarketplaceCustomersService],
})
export class CustomersModule {}
