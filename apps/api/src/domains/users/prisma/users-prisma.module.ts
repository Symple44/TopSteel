import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { UsersPrismaService } from '../users-prisma.service'

/**
 * UsersPrismaModule - Phase 6.1 + 7.1
 *
 * Module Prisma pour la gestion des utilisateurs
 *
 * Controllers:
 * - UsersPrismaController: Endpoints REST /users-prisma (Phase 7.1)
 *
 * Provides:
 * - UsersPrismaService: CRUD utilisateurs avec Prisma
 *
 * Exports:
 * - UsersPrismaService: Pour utilisation dans autres modules
 */
@Module({
  imports: [PrismaModule],
  controllers: [], // Controllers removed - deprecated -prisma controllers
  providers: [UsersPrismaService],
  exports: [UsersPrismaService],
})
export class UsersPrismaModule {}
