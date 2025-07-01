import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanningService } from "./planning.service";
import { PlanningController } from "./planning.controller";
import { Planning } from "./entities/planning.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Planning])],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
