import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { UserPrismaService } from './user-prisma.service'

/**
 * UsersPrismaModule - Phase 6.1
 *
 * Module Prisma pour la gestion des utilisateurs
 *
 * Provides:
 * - UserPrismaService: CRUD utilisateurs avec Prisma
 *
 * Exports:
 * - UserPrismaService: Pour utilisation dans autres modules
 */
@Module({
  imports: [PrismaModule],
  providers: [UserPrismaService],
  exports: [UserPrismaService],
})
export class UsersPrismaModule {}
