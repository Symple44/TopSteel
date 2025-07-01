import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MateriauxService } from "./materiaux.service";
import { MateriauxController } from "./materiaux.controller";
import { Materiaux } from "./entities/materiaux.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Materiaux])],
  controllers: [MateriauxController],
  providers: [MateriauxService],
  exports: [MateriauxService],
})
export class MateriauxModule {}
