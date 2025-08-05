import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
// Module multi-tenant est nécessaire pour MultiTenantDatabaseConfig
import { DatabaseMultiTenantModule } from '../../core/database/database-multi-tenant.module'
// Entités utilisées par TenantInitializationService
import { User } from '../../domains/users/entities/user.entity'
import { UserSettings } from '../../domains/users/entities/user-settings.entity'
import { NotificationSettings } from '../notifications/entities/notification-settings.entity'
import { SitesController } from './controllers/sites.controller'
import { SocieteUsersController } from './controllers/societe-users.controller'
// Controllers
import { SocietesController } from './controllers/societes.controller'
import { TenantProvisioningController } from './controllers/tenant-provisioning.controller'
import { Site } from './entities/site.entity'
// Entités
import { Societe } from './entities/societe.entity'
import { SocieteUser } from './entities/societe-user.entity'
import { SitesService } from './services/sites.service'
import {
  SocieteAuthRepositoryService,
  SocieteUserAuthRepositoryService,
} from './services/societe-auth-repository.service'
import { SocieteUsersService } from './services/societe-users.service'
// Services
import { SocietesService } from './services/societes.service'
import { TenantInitializationService } from './services/tenant-initialization.service'
import { TenantProvisioningService } from './services/tenant-provisioning.service'

@Module({
  imports: [
    ConfigModule,
    DatabaseMultiTenantModule, // Pour avoir accès à MultiTenantDatabaseConfig

    // Repositories pour la base AUTH
    TypeOrmModule.forFeature(
      [Societe, Site, SocieteUser, User, UserSettings, NotificationSettings],
      'auth'
    ),
  ],
  controllers: [
    SocietesController,
    SitesController,
    SocieteUsersController,
    TenantProvisioningController,
  ],
  providers: [
    SocietesService,
    SitesService,
    SocieteUsersService,
    TenantProvisioningService,
    TenantInitializationService,
    // MultiTenantDatabaseConfig est déjà fourni par DatabaseMultiTenantModule
    SocieteAuthRepositoryService,
    SocieteUserAuthRepositoryService,
  ],
  exports: [
    SocietesService,
    SitesService,
    SocieteUsersService,
    TenantProvisioningService,
    TenantInitializationService,
    SocieteAuthRepositoryService,
    SocieteUserAuthRepositoryService,
  ],
})
export class SocietesModule {}
