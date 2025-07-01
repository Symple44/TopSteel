import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FacturationService } from "./facturation.service";
import { FacturationController } from "./facturation.controller";
import { Facturation } from "./entities/facturation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Facturation])],
  controllers: [FacturationController],
  providers: [FacturationService],
  exports: [FacturationService],
})
export class FacturationModule {}
