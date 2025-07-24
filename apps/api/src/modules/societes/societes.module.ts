import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'

// Entités
import { Societe } from './entities/societe.entity'
import { Site } from './entities/site.entity'
import { SocieteUser } from './entities/societe-user.entity'

// Entités utilisées par TenantInitializationService
import { User } from '../users/entities/user.entity'
import { UserSettings } from '../users/entities/user-settings.entity'
import { NotificationSettings } from '../notifications/entities/notification-settings.entity'

// Services
import { SocietesService } from './services/societes.service'
import { SitesService } from './services/sites.service'
import { SocieteUsersService } from './services/societe-users.service'
import { TenantProvisioningService } from './services/tenant-provisioning.service'
import { TenantInitializationService } from './services/tenant-initialization.service'

// Configuration multi-tenant
import { MultiTenantDatabaseConfig } from '../../database/config/multi-tenant-database.config'

// Controllers
import { SocietesController } from './controllers/societes.controller'
import { SitesController } from './controllers/sites.controller'
import { SocieteUsersController } from './controllers/societe-users.controller'
import { TenantProvisioningController } from './controllers/tenant-provisioning.controller'

@Module({
  imports: [
    ConfigModule,
    
    // Repositories pour la base AUTH
    TypeOrmModule.forFeature([
      Societe,
      Site,
      SocieteUser,
      User,
      UserSettings,
      NotificationSettings,
    ], 'auth'),
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
    MultiTenantDatabaseConfig,
  ],
  exports: [
    SocietesService,
    SitesService,
    SocieteUsersService,
    TenantProvisioningService,
    TenantInitializationService,
  ],
})
export class SocietesModule {}