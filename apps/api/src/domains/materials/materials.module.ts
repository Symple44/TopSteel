import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MaterialController } from './controllers/material.controller'
import { Material } from './entities/material.entity'
import { MaterialRepositoryImpl } from './repositories/material-repository.impl'
import { MaterialService } from './services/material.service'

/**
 * Module pour la gestion des matériaux industriels
 */
@Module({
  imports: [TypeOrmModule.forFeature([Material], 'tenant')],
  controllers: [MaterialController],
  providers: [
    MaterialService,
    {
      provide: 'IMaterialRepository',
      useClass: MaterialRepositoryImpl,
    },
  ],
  exports: [MaterialService],
})
export class MaterialsModule {}
