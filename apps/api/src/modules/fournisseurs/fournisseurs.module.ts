import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FournisseursService } from './fournisseurs.service';
import { FournisseursController } from './fournisseurs.controller';
import { Fournisseurs } from './entities/fournisseurs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fournisseurs])],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}
