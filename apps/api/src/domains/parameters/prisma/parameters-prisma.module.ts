import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { ParameterSystemPrismaService } from './parameter-system-prisma.service'
import { ParameterApplicationPrismaService } from './parameter-application-prisma.service'
import { ParameterClientPrismaService } from './parameter-client-prisma.service'

/**
 * ParametersPrismaModule - Phase 2.4 (Complete - 3/3 entities)
 *
 * Module pour gestion des paramètres avec Prisma
 *
 * Provides:
 * - ParameterSystemPrismaService pour paramètres système (non-modifiables)
 * - ParameterApplicationPrismaService pour paramètres application (business logic)
 * - ParameterClientPrismaService pour paramètres client (UI/UX utilisateur final)
 */
@Module({
  imports: [PrismaModule],
  providers: [ParameterSystemPrismaService, ParameterApplicationPrismaService, ParameterClientPrismaService],
  exports: [ParameterSystemPrismaService, ParameterApplicationPrismaService, ParameterClientPrismaService],
})
export class ParametersPrismaModule {}
