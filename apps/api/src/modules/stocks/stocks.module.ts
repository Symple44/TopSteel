import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Produit } from "./entities/produit.entity";
import { Stocks } from "./entities/stocks.entity";
import { ProduitsController } from "./produits.controller";
import { ProduitsService } from "./produits.service";
import { StocksController } from "./stocks.controller";
import { StocksService } from "./stocks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Stocks, Produit])],
  controllers: [StocksController, ProduitsController],
  providers: [StocksService, ProduitsService],
  exports: [StocksService, ProduitsService],
})
export class StocksModule {}
