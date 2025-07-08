import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Operation } from './entities/operation.entity'
import { OrdreFabrication } from './entities/ordre-fabrication.entity'
import { Production } from './entities/production.entity'
import { OperationController } from './operation.controller'
import { OperationService } from './operation.service'
import { OrdreFabricationController } from './ordre-fabrication.controller'
import { OrdreFabricationService } from './ordre-fabrication.service'
import { ProductionController } from './production.controller'
import { ProductionService } from './production.service'

@Module({
  imports: [TypeOrmModule.forFeature([Production, OrdreFabrication, Operation])],
  controllers: [ProductionController, OrdreFabricationController, OperationController],
  providers: [ProductionService, OrdreFabricationService, OperationService],
  exports: [ProductionService, OrdreFabricationService, OperationService],
})
export class ProductionModule {}
