import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjetsService } from './projets.service';
import { ProjetsController } from './projets.controller';
import { Projets } from './entities/projets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Projets])],
  controllers: [ProjetsController],
  providers: [ProjetsService],
  exports: [ProjetsService],
})
export class ProjetsModule {}
