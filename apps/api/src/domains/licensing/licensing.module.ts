import { Module } from '@nestjs/common'
import { LicensesController } from './controllers/licenses.controller'
import { LicenseFeaturesController } from './controllers/license-features.controller'
import { LicenseStatusController } from './controllers/license-status.controller'
import { LicensingPrismaModule } from './prisma/licensing-prisma.module'

/**
 * Licensing Module
 *
 * Module principal pour la gestion des licenses
 * - Contrôleurs CRUD pour les licenses
 * - Gestion des features
 * - Gestion du statut (activation, suspension, révocation)
 * - Basé sur Prisma ORM
 *
 * Routes exposées:
 * - /api/licensing/licenses (CRUD)
 * - /api/licensing/licenses/:id/features (Features management)
 * - /api/licensing/licenses/:id/activate|suspend|revoke|renew (Status management)
 */
@Module({
  imports: [LicensingPrismaModule],
  controllers: [LicensesController, LicenseFeaturesController, LicenseStatusController],
  exports: [LicensingPrismaModule],
})
export class LicensingModule {}
