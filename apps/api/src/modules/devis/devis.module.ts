import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DevisService } from "./devis.service";
import { DevisController } from "./devis.controller";
import { Devis } from "./entities/devis.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Devis])],
  controllers: [DevisController],
  providers: [DevisService],
  exports: [DevisService],
})
export class DevisModule {}
