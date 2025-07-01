import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrdreFabrication } from "./entities/ordre-fabrication.entity";
import { Production } from "./entities/production.entity";
import { OrdreFabricationController } from "./ordre-fabrication.controller";
import { OrdreFabricationService } from "./ordre-fabrication.service";
import { ProductionController } from "./production.controller";
import { ProductionService } from "./production.service";

@Module({
  imports: [TypeOrmModule.forFeature([Production, OrdreFabrication])],
  controllers: [ProductionController, OrdreFabricationController],
  providers: [ProductionService, OrdreFabricationService],
  exports: [ProductionService, OrdreFabricationService],
})
export class ProductionModule {}
