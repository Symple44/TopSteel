/**
 * Minimal Test Module for E2E Tests
 * Only imports absolute minimum to test Prisma CRUD operations
 * Avoids loading modules with compilation errors
 */
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

// Only Prisma - no TypeORM modules
import { PrismaModule } from '../src/core/database/prisma/prisma.module'
import { AuthPrismaModule } from '../src/domains/auth/prisma/auth-prisma.module'
import { AuthController } from '../src/domains/auth/auth.controller'
import { UsersController } from '../src/domains/users/users.controller'
import { UserPrismaService } from '../src/domains/users/prisma/user-prisma.service'
import { jwtConfig } from '../src/core/config/jwt.config'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig], // Load JWT config namespace
    }),

    // Database
    PrismaModule,

    // Auth - Prisma-based
    AuthPrismaModule,

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [UserPrismaService],
  exports: [PrismaModule, AuthPrismaModule, UserPrismaService],
})
export class TestAppModule {}
