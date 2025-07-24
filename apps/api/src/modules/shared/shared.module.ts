import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'

// Import des entités partagées
import { SharedMaterial } from './entities/shared-material.entity'
import { SharedSupplier } from './entities/shared-supplier.entity'
import { SharedProcess } from './entities/shared-process.entity'
import { SharedQualityStandard } from './entities/shared-quality-standard.entity'
import { SharedDataRegistry } from './entities/shared-data-registry.entity'

// Services
import { SharedMaterialService } from './services/shared-material.service'
import { SharedSupplierService } from './services/shared-supplier.service'
import { SharedProcessService } from './services/shared-process.service'
import { SharedQualityStandardService } from './services/shared-quality-standard.service'
import { SharedDataRegistryService } from './services/shared-data-registry.service'

// Controllers
import { SharedMaterialController } from './controllers/shared-material.controller'
import { SharedSupplierController } from './controllers/shared-supplier.controller'
import { SharedProcessController } from './controllers/shared-process.controller'
import { SharedQualityStandardController } from './controllers/shared-quality-standard.controller'

@Module({
  imports: [
    ConfigModule,
    
    // Repositories pour la base SHARED
    TypeOrmModule.forFeature([
      SharedMaterial,
      SharedSupplier,
      SharedProcess,
      SharedQualityStandard,
    ], 'shared'),

    // Repositories pour la base AUTH (pour SharedDataRegistry)
    TypeOrmModule.forFeature([
      SharedDataRegistry,
    ], 'auth'),
  ],
  controllers: [
    SharedMaterialController,
    SharedSupplierController,
    SharedProcessController,
    SharedQualityStandardController,
  ],
  providers: [
    SharedMaterialService,
    SharedSupplierService,
    SharedProcessService,
    SharedQualityStandardService,
    SharedDataRegistryService,
  ],
  exports: [
    SharedMaterialService,
    SharedSupplierService,
    SharedProcessService,
    SharedQualityStandardService,
    SharedDataRegistryService,
  ],
})
export class SharedModule {}