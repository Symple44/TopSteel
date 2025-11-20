import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
// import { UserPrismaService } from './user-prisma.service' // REMOVED - File deleted

/**
 * UsersPrismaModule - Phase 6.1 + 7.1
 *
 * Module Prisma pour la gestion des utilisateurs
 *
 * Controllers:
 * - UsersPrismaController: Endpoints REST /users-prisma (Phase 7.1)
 *
 * Provides:
 * - UserPrismaService: CRUD utilisateurs avec Prisma
 *
 * Exports:
 * - UserPrismaService: Pour utilisation dans autres modules
 */
@Module({
  imports: [PrismaModule],
  controllers: [], // Controllers removed - deprecated -prisma controllers
  providers: [/* UserPrismaService */], // Service removed - file deleted
  exports: [/* UserPrismaService */], // Service removed - file deleted
})
export class UsersPrismaModule {}
