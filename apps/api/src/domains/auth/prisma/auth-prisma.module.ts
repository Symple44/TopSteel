import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { AuthPrismaService } from './auth-prisma.service'

/**
 * AuthPrismaModule - POC Phase 1.2/1.3
 *
 * Module pour l'authentification avec Prisma
 *
 * Provides:
 * - AuthPrismaService pour opérations auth avec Prisma
 *
 * Utilisé pour:
 * - POC validation migration TypeORM → Prisma
 * - Tests de performance Prisma vs TypeORM
 * - Endpoint /auth/login-prisma pour tests parallèles
 */
@Module({
  imports: [PrismaModule],
  providers: [AuthPrismaService],
  exports: [AuthPrismaService],
})
export class AuthPrismaModule {}
