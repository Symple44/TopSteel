import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { AuthPrismaService } from './auth-prisma.service'
import { AuthPrismaController } from './auth-prisma.controller'

/**
 * AuthPrismaModule - POC Phase 1.2/1.3/1.4
 *
 * Module pour l'authentification avec Prisma
 *
 * Provides:
 * - AuthPrismaService pour opérations auth avec Prisma
 * - AuthPrismaController pour endpoint /auth-prisma/login
 *
 * Utilisé pour:
 * - POC validation migration TypeORM → Prisma
 * - Tests de performance Prisma vs TypeORM
 * - Endpoint /auth-prisma/login pour tests parallèles avec /auth/login
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1h',
        },
      }),
    }),
  ],
  controllers: [AuthPrismaController],
  providers: [AuthPrismaService],
  exports: [AuthPrismaService],
})
export class AuthPrismaModule {}
