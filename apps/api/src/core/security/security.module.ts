import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CSPNonceService } from './csp-nonce.service'
import { CSPViolationsController } from './csp-violations.controller'
import { EnhancedCSPMiddleware } from './enhanced-csp.middleware'

@Module({
  imports: [ConfigModule],
  controllers: [CSPViolationsController],
  providers: [CSPNonceService, EnhancedCSPMiddleware],
  exports: [CSPNonceService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSP middleware to all routes
    consumer.apply(EnhancedCSPMiddleware).forRoutes('*')
  }
}
