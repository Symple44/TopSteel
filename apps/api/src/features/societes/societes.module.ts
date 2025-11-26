import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Controllers
import { SocietesController } from './controllers/societes.controller'
import { SitesController } from './controllers/sites.controller'
import { SocieteUsersController } from './controllers/societe-users.controller'
// import { TenantProvisioningController } from './controllers/tenant-provisioning.controller' // Disabled - depends on TenantProvisioningService (TypeORM)

// Services (migrated to Prisma)
import { SocietesService } from './services/societes.service'
import { SitesService } from './services/sites.service'
import { SocieteUsersService } from './services/societe-users.service'
import {
  SocieteAuthRepositoryService,
  SocieteUserAuthRepositoryService,
} from './services/societe-auth-repository.service'
// import { TenantProvisioningService } from './services/tenant-provisioning.service'
// import { TenantInitializationService } from './services/tenant-initialization.service'
// import { LicenseManagementService } from './services/license-management.service'

// Prisma modules
import { SocietesPrismaModule } from '../../domains/societes/prisma/societes-prisma.module'
import { DatabaseModule } from '../../core/database/database.module'

/**
 * Module de gestion des sociétés
 * Migrated from TypeORM to Prisma
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule, // Provides PrismaService
    SocietesPrismaModule, // Prisma-based societes services
  ],
  controllers: [
    SocietesController,
    SitesController,
    SocieteUsersController,
    // TenantProvisioningController, // Disabled - depends on TenantProvisioningService (TypeORM)
  ],
  providers: [
    // Services convertis vers Prisma
    SocietesService,
    SitesService,
    SocieteUsersService,
    SocieteAuthRepositoryService,
    SocieteUserAuthRepositoryService,

    // Services à convertir plus tard
    // TenantProvisioningService, // TODO: Dépend de DataSource TypeORM
    // TenantInitializationService, // TODO: Dépend de @InjectRepository
    // LicenseManagementService, // TODO: Dépend de @InjectRepository
  ],
  exports: [
    SocietesService,
    SitesService,
    SocieteUsersService,
    SocieteAuthRepositoryService,
    SocieteUserAuthRepositoryService,
  ],
})
export class SocietesModule {}
