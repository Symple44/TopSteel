import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { ParameterSystemPrismaService } from './parameter-system-prisma.service'
import { ParameterApplicationPrismaService } from './parameter-application-prisma.service'
import { ParameterClientPrismaService } from './parameter-client-prisma.service'

/**
 * ParametersPrismaModule - Phase 2.4 + Phase 5.3 (Complete - 3/3 entities + 1 controller)
 *
 * Module pour gestion des paramètres avec Prisma
 *
 * Provides:
 * - ParameterSystemPrismaService pour paramètres système (non-modifiables)
 * - ParameterApplicationPrismaService pour paramètres application (business logic)
 * - ParameterClientPrismaService pour paramètres client (UI/UX utilisateur final)
 * - ParametersPrismaController pour endpoints REST (Phase 5.3)
 */
@Module({
  imports: [PrismaModule],
  controllers: [], // Controllers removed - deprecated -prisma controllers
  providers: [ParameterSystemPrismaService, ParameterApplicationPrismaService, ParameterClientPrismaService],
  exports: [ParameterSystemPrismaService, ParameterApplicationPrismaService, ParameterClientPrismaService],
})
export class ParametersPrismaModule {}
