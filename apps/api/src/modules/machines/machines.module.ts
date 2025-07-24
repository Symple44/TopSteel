import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Machine } from './entities/machine.entity'
import { MachinesController } from './machines.controller'
import { MachinesService } from './machines.service'

@Module({
  imports: [TypeOrmModule.forFeature([Machine], 'tenant')],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
