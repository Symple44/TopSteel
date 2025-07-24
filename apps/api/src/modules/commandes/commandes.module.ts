// commandes.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommandesController } from './commandes.controller'
import { CommandesService } from './commandes.service'
import { Commande } from './entities/commande.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Commande], 'tenant')],
  controllers: [CommandesController],
  providers: [CommandesService],
  exports: [CommandesService],
})
export class CommandesModule {}
