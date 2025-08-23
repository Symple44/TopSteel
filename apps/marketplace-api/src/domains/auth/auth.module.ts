import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthService } from './services/auth.service'
import { AuthController } from './controllers/auth.controller'
import { MarketplaceCustomer } from '../customers/entities/marketplace-customer.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceCustomer], 'marketplace'),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'marketplace-secret-key',
      signOptions: { expiresIn: '15m' }
    })
  ],
  providers: [
    AuthService,
  ],
  controllers: [
    AuthController,
  ],
  exports: [
    AuthService,
  ],
})
export class AuthModule {}
