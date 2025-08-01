import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminModule } from '../admin/admin.module'
import { MarketplaceController } from './controllers/marketplace.controller'
import { MarketplaceModule as MarketplaceModuleEntity } from './entities/marketplace-module.entity'
import { ModuleInstallation } from './entities/module-installation.entity'
import { ModuleRating } from './entities/module-rating.entity'
import { MarketplaceService } from './services/marketplace.service'
import { ModuleRegistryService } from './services/module-registry.service'

@Module({
  imports: [
    // Entités dans la base auth (catalogue global)
    TypeOrmModule.forFeature([MarketplaceModuleEntity], 'auth'),
    // Entités dans la base tenant (données par société)
    TypeOrmModule.forFeature([ModuleInstallation, ModuleRating], 'tenant'),
    AdminModule,
  ],
  providers: [MarketplaceService, ModuleRegistryService],
  controllers: [MarketplaceController],
  exports: [MarketplaceService, ModuleRegistryService],
})
export class MarketplaceAppModule {}
