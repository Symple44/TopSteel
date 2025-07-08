import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Projet } from './entities/projet.entity'
import { ProjetsController } from './projets.controller'
import { ProjetsService } from './projets.service'

@Module({
  imports: [TypeOrmModule.forFeature([Projet])],
  controllers: [ProjetsController],
  providers: [ProjetsService],
  exports: [ProjetsService],
})
export class ProjetsModule {}
