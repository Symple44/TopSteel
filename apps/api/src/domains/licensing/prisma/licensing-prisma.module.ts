import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { LicensePrismaService } from './license-prisma.service'

/**
 * LicensingPrismaModule
 *
 * Module Prisma pour le domaine Licensing
 * - Gestion complète des licenses
 * - Features management
 * - Activations tracking
 * - Usage monitoring
 */
@Module({
  imports: [PrismaModule],
  providers: [LicensePrismaService],
  exports: [LicensePrismaService],
})
export class LicensingPrismaModule {}
