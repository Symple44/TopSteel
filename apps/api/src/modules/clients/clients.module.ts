import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'
import { Clients } from './entities/clients.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Clients], 'tenant')],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
