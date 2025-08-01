import { Module } from '@nestjs/common'

// TODO: Implémenter auth marketplace
// import { AuthService } from './services/auth.service'
// import { AuthController } from './controllers/auth.controller'

@Module({
  imports: [],
  providers: [
    // AuthService,
  ],
  controllers: [
    // AuthController,
  ],
  exports: [
    // AuthService,
  ],
})
export class AuthModule {}