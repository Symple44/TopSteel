// apps/api/src/modules/projets/projets.module.ts
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClientsModule } from '../clients/clients.module'
import { UsersModule } from '../users/users.module'
import { Projet } from './entities/projet.entity'
import { ProjetsController } from './projets.controller'
import { ProjetsService } from './projets.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Projet]),
    BullModule.registerQueue({
      name: 'projets',
    }),
    ClientsModule,
    UsersModule,
  ],
  controllers: [ProjetsController],
  providers: [ProjetsService],
  exports: [ProjetsService],
})
export class ProjetsModule {}
