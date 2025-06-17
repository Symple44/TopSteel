// apps/api/src/modules/fournisseurs/fournisseurs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fournisseur } from './entities/fournisseur.entity';
import { FournisseursController } from './fournisseurs.controller';
import { FournisseursService } from './fournisseurs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fournisseur])],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}