import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MaterialController } from './controllers/material.controller'
import { MaterialMovementController } from './controllers/material-movement.controller'
import { Material } from './entities/material.entity'
import { MaterialMovement } from './entities/material-movement.entity'
import { MaterialRepositoryImpl } from './repositories/material-repository.impl'
import { MaterialService } from './services/material.service'
import { MaterialMovementService } from './services/material-movement.service'

/**
 * Module pour la gestion des matériaux industriels
 */
@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialMovement], 'tenant')],
  controllers: [MaterialController, MaterialMovementController],
  providers: [
    MaterialService,
    MaterialMovementService,
    {
      provide: 'IMaterialRepository',
      useClass: MaterialRepositoryImpl,
    },
  ],
  exports: [MaterialService, MaterialMovementService],
})
export class MaterialsModule {}
