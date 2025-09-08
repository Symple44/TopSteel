import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MarketplaceCustomer } from '../customers/entities/marketplace-customer.entity'
import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'

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
        return secret || (isProduction ? undefined : 'marketplace-dev-jwt-secret-min-32-characters')
      })(),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
